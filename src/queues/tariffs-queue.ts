import { Queue, Worker, type JobsOptions } from "bullmq";

import env from "@/config/env/env.js";
import logger from "@/utils/logger.js";

const connection = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
};

export const tariffsQueueName = "tariffs-queue";
if (env.WB_TARIFFS_QUEUE_NAME && env.WB_TARIFFS_QUEUE_NAME !== tariffsQueueName) {
    logger.warn(
        {
            configured: env.WB_TARIFFS_QUEUE_NAME,
            effective: tariffsQueueName,
        },
        "WB_TARIFFS_QUEUE_NAME is ignored; using fixed queue name",
    );
}

export const createTariffsQueue = () => {
    return new Queue(tariffsQueueName, { connection });
};

export const createTariffsWorker = (
    processor: (payload: { date?: string }) => Promise<void>,
) => {
    return new Worker(
        tariffsQueueName,
        async (job) => {
            await processor(job.data as { date?: string });
        },
        {
            connection,
            concurrency: env.WB_TARIFFS_WORKER_CONCURRENCY,
        },
    );
};

export const createTariffsJobOptions = (): JobsOptions => ({
    attempts: env.WB_TARIFFS_JOB_ATTEMPTS,
    backoff: {
        type: "exponential",
        delay: env.WB_TARIFFS_BACKOFF_DELAY_MS,
    },
});
