import fastify from "fastify";
import env from "@/config/env/env.js";
import { migrate, seed } from "@/postgres/knex.js";
import { createHealthHandler } from "@/handlers/health.js";
import { createGetTariffsHandler } from "@/handlers/tariffs.js";
import { registerRoutes } from "@/routes.js";
import {
    createTariffsJobOptions,
    createTariffsQueue,
} from "@/queues/tariffs-queue.js";
import logger from "@/utils/logger.js";

await migrate.latest();
await seed.run();

const app = fastify({ logger });

const tariffsQueue = createTariffsQueue();

app.addHook("onClose", async () => {
    await tariffsQueue.close();
});

const enqueueTariffsJob = async (date: string) => {
    await tariffsQueue.add(
        "getTariffs",
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

const port = env.APP_PORT;
const host = "0.0.0.0";

await app.listen({ port, host });
