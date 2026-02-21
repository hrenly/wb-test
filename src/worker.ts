import env from "@/config/env/env.js";
import { fetchTariffs } from "@/services/tariffs.js";
import { createTariffsWorker } from "@/queues/tariffs-queue.js";
import logger from "@/utils/logger.js";

const worker = createTariffsWorker(async ({ date }) => {
    await fetchTariffs(date);
});

worker.on("failed", (job, err) => {
    const jobId = job?.id ?? "unknown";
    logger.error({ jobId, err }, "Tariffs job failed");
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
