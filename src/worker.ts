import env from "@/config/env/env.js";
import knex from "@/postgres/knex.js";
import { createTariffsWorker } from "@/queues/tariffs-queue.js";
import { createTariffsJobHandler } from "@/handlers/tariffs-job.handler.js";
import logger from "@/utils/logger.js";

const handleTariffsJob = createTariffsJobHandler(knex);

const worker = createTariffsWorker(async ({ date }) => {
    await handleTariffsJob({ date });
});

worker.on("active", (job) => {
    const jobId = job?.id ?? "unknown";
    logger.info({ jobId, date: job?.data?.date }, "Tariffs job started");
});

worker.on("completed", (job, result) => {
    const jobId = job?.id ?? "unknown";
    logger.info({ jobId, date: job?.data?.date, result }, "Tariffs job finished");
});

worker.on("failed", (job, err) => {
    const jobId = job?.id ?? "unknown";
    logger.error({ jobId, date: job?.data?.date, err }, "Tariffs job failed");
});

const shutdown = async () => {
    await worker.close();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

logger.info(
    {
        queue: env.WB_TARIFFS_QUEUE_NAME,
        concurrency: env.WB_TARIFFS_WORKER_CONCURRENCY,
    },
    "Tariffs worker started",
);
