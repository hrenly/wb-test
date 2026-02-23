import env from "@/config/env/env.js";
import { createSheetsExportJobOptions, createSheetsExportQueue } from "@/queues/sheets.export.queue.js";
import logger from "@/utils/logger.js";

const queue = createSheetsExportQueue();

const shutdown = async () => {
    await queue.close();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const main = async () => {
    if (!env.SHEETS_EXPORT_CRON) {
        throw new Error("SHEETS_EXPORT_CRON is not configured");
    }

    const repeat = { pattern: env.SHEETS_EXPORT_CRON };

    await queue.add(
        "sheets:export:tick",
        {},
        {
            ...createSheetsExportJobOptions(),
            jobId: "sheets:export:tick",
            repeat,
        },
    );

    logger.info(
        {
            name: "sheets:export:tick",
            repeat,
            queue: "sheets-export-queue",
        },
        "Registered sheets export schedule",
    );

    await queue.close();
};

try {
    await main();
} catch (err) {
    logger.error({ err }, "Failed to register sheets export schedule");
    await queue.close();
    process.exit(1);
}
