import { Queue, Worker, type JobsOptions } from "bullmq";

import env from "@/config/env/env.js";

const connection = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
};

export const sheetsExportQueueName = "sheets-export-queue";

const defaultJobOptions: JobsOptions = {
    attempts: 3,
    backoff: {
        type: "exponential",
        delay: 30_000,
    },
};

export const createSheetsExportQueue = () => new Queue(sheetsExportQueueName, { connection });

export const createSheetsExportWorker = (
    processor: (payload: Record<string, unknown>) => Promise<void>,
) =>
    new Worker(
        sheetsExportQueueName,
        async (job) => {
            await processor(job.data as Record<string, unknown>);
        },
        {
            connection,
            concurrency: 2,
        },
    );

export const createSheetsExportJobOptions = (): JobsOptions => ({
    ...defaultJobOptions,
});
