import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production"]),
    POSTGRES_HOST: z.string(),
    POSTGRES_PORT: z
        .string()
        .regex(/^[0-9]+$/)
        .transform((value) => parseInt(value)),
    POSTGRES_DB: z.string(),
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string(),
    REDIS_HOST: z.string(),
    REDIS_PORT: z
        .string()
        .regex(/^[0-9]+$/)
        .transform((value) => parseInt(value)),
    WB_TARIFFS_BOX_URL: z.string().url(),
    WB_TARIFFS_AUTH_TOKEN: z.string(),
    WB_TARIFFS_QUEUE_NAME: z.string(),
    WB_TARIFFS_JOB_ATTEMPTS: z
        .string()
        .regex(/^[0-9]+$/)
        .transform((value) => parseInt(value)),
    WB_TARIFFS_BACKOFF_DELAY_MS: z
        .string()
        .regex(/^[0-9]+$/)
        .transform((value) => parseInt(value)),
    WB_TARIFFS_WORKER_CONCURRENCY: z
        .string()
        .regex(/^[0-9]+$/)
        .transform((value) => parseInt(value)),
    APP_PORT: z
        .string()
        .regex(/^[0-9]+$/)
        .transform((value) => parseInt(value)),
});

const envResult = envSchema.safeParse({
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_PORT: process.env.POSTGRES_PORT,
    POSTGRES_DB: process.env.POSTGRES_DB,
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    WB_TARIFFS_BOX_URL: process.env.WB_TARIFFS_BOX_URL,
    WB_TARIFFS_AUTH_TOKEN: process.env.WB_TARIFFS_AUTH_TOKEN,
    WB_TARIFFS_QUEUE_NAME: process.env.WB_TARIFFS_QUEUE_NAME,
    WB_TARIFFS_JOB_ATTEMPTS: process.env.WB_TARIFFS_JOB_ATTEMPTS,
    WB_TARIFFS_BACKOFF_DELAY_MS: process.env.WB_TARIFFS_BACKOFF_DELAY_MS,
    WB_TARIFFS_WORKER_CONCURRENCY: process.env.WB_TARIFFS_WORKER_CONCURRENCY,
    NODE_ENV: process.env.NODE_ENV,
    APP_PORT: process.env.APP_PORT,
});

if (!envResult.success) {
    const missingVars = envResult.error.issues
        .filter((issue) => issue.code === "invalid_type")
        .map((issue) => issue.path.join("."));

    const missingNote =
        missingVars.length > 0
            ? ` Missing or invalid env vars: ${missingVars.join(", ")}.`
            : "";

    throw new Error(`Environment validation failed.${missingNote}`);
}

const env = envResult.data;

export default env;
