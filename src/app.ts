import fastify from "fastify";
import env from "@/config/env/env.js";
import { migrate, seed } from "@/postgres/knex.js";
import { createHealthHandler } from "@/handlers/health.handler.js";
import { createGetTariffsHandler } from "@/handlers/tariffs.handler.js";
import { registerRoutes } from "@/routes.js";
import {
    createTariffsJobOptions,
    createTariffsQueue,
} from "@/queues/tariffs.queue.js";

await migrate.latest();
await seed.run();

const app = fastify({
    logger: {
        level: process.env.LOG_LEVEL ?? "info",
    },
});

const tariffsQueue = createTariffsQueue();

app.addHook("onClose", async () => {
    await tariffsQueue.close();
});

const enqueueTariffsJob = async (date: string) => {
    await tariffsQueue.add(
        "tariffs:hourly",
        { date },
        createTariffsJobOptions(),
    );
};

const healthHandler = createHealthHandler();
const getTariffsHandler = createGetTariffsHandler({ enqueueTariffsJob });

registerRoutes(app, {
    healthHandler,
    getTariffsHandler,
});

if (!env.APP_PORT) {
    throw new Error("APP_PORT is not configured");
}

const port = env.APP_PORT;
const host = "0.0.0.0";

await app.listen({ port, host });
