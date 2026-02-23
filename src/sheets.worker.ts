import env from "@/config/env/env.js";
import knex from "@/postgres/knex.js";
import {
    fetchEnabledTargets,
    fetchMaxFetchedAt,
} from "@/postgres/sheets.repo.js";
import {
    createSheetsExportJobOptions,
    createSheetsExportQueue,
    createSheetsExportWorker,
} from "@/queues/sheets.export.queue.js";
import { createSheetsClient } from "@/services/sheets.service.js";
import logger from "@/utils/logger.js";
import { runSheetsExport, type SheetsExportJobPayload } from "@/handlers/sheets.export.handler.js";

const getBusinessDate = (timeZone: string) => {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    return formatter.format(new Date());
};

const sheets = await createSheetsClient();
const queue = createSheetsExportQueue();

const worker = createSheetsExportWorker(async (payload) => {
    if (!env.EXPORT_TIMEZONE) {
        throw new Error("EXPORT_TIMEZONE is not configured");
    }

    if (!env.SHEETS_TARIFFS_SHEET_NAME) {
        throw new Error("SHEETS_TARIFFS_SHEET_NAME is not configured");
    }

    if (payload && payload["targetId"]) {
        const jobPayload = payload as SheetsExportJobPayload;
        try {
            const result = await runSheetsExport(knex, sheets, jobPayload);
            logger.info(
                { targetId: jobPayload.targetId, tariffDate: jobPayload.tariffDate, result },
                "Sheets export finished",
            );
            return;
        } catch (err) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 403) {
                logger.error(
                    { targetId: jobPayload.targetId, err },
                    "Sheets export forbidden (check sharing)",
                );
                return;
            }

            if (status === 429 || (status && status >= 500)) {
                logger.warn(
                    { targetId: jobPayload.targetId, err },
                    "Sheets export failed; will retry",
                );
            }

            throw err;
        }
    }

    const tariffDate = getBusinessDate(env.EXPORT_TIMEZONE);
    const maxFetchedAt = await fetchMaxFetchedAt(knex, tariffDate);

    if (!maxFetchedAt) {
        logger.info({ tariffDate }, "No tariffs found for export");
        return;
    }

    const targets = await fetchEnabledTargets(knex);
    if (targets.length === 0) {
        logger.info("No enabled Google Sheets targets");
        return;
    }

    const sourceFetchedAt = maxFetchedAt.toISOString();
    const exportJobs = targets.filter((target) => {
        if (!target.last_source_fetched_at) return true;
        return target.last_source_fetched_at.getTime() !== maxFetchedAt.getTime();
    });

    if (exportJobs.length === 0) {
        logger.info({ tariffDate, sourceFetchedAt }, "Sheets export skipped; no changes detected");
        return;
    }

    for (const target of exportJobs) {
        const jobId = `sheets:export:sheet:${target.id}:${sourceFetchedAt}`;
        await queue.add(
            "sheets:export:sheet",
            {
                targetId: target.id,
                tariffDate,
                sourceFetchedAt,
            },
            {
                ...createSheetsExportJobOptions(),
                jobId,
            },
        );
    }

    logger.info(
        {
            tariffDate,
            sourceFetchedAt,
            targets: exportJobs.length,
        },
        "Scheduled sheets export jobs",
    );
});

worker.on("active", (job) => {
    logger.info({ jobId: job.id, name: job.name }, "Sheets job started");
});

worker.on("completed", (job) => {
    logger.info({ jobId: job.id, name: job.name }, "Sheets job completed");
});

worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, name: job?.name, err }, "Sheets job failed");
});

const shutdown = async () => {
    await worker.close();
    await queue.close();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

logger.info(
    {
        queue: "sheets-export-queue",
    },
    "Sheets worker started",
);
