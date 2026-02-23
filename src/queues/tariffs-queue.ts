import { Queue, Worker, type JobsOptions } from "bullmq";

import env from "@/config/env/env.js";
import logger from "@/utils/logger.js";

const connection = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
};

const normalizeQueueName = (name: string) => name.replace(/:/g, "-");

export const tariffsQueueName = normalizeQueueName(env.WB_TARIFFS_QUEUE_NAME);
if (tariffsQueueName !== env.WB_TARIFFS_QUEUE_NAME) {
    logger.warn(
        {
            original: env.WB_TARIFFS_QUEUE_NAME,
            normalized: tariffsQueueName,
        },
        "WB_TARIFFS_QUEUE_NAME contains ':'; using normalized name",
    );
}

export const createTariffsQueue = () => {
    return new Queue(tariffsQueueName, { connection });
};

export const createTariffsWorker = (
    processor: (payload: { date: string }) => Promise<void>,
) => {
    return new Worker(
        tariffsQueueName,
        async (job) => {
            await processor(job.data as { date: string });
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
