import { createTariffsJobOptions, createTariffsQueue } from "@/queues/tariffs.queue.js";
import logger from "@/utils/logger.js";

const queue = createTariffsQueue();

const shutdown = async () => {
    await queue.close();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const main = async () => {
    const repeat = { pattern: "0 * * * *" };

    await queue.add(
        "tariffs:hourly",
        {},
        {
            ...createTariffsJobOptions(),
            jobId: "tariffs:hourly",
            repeat,
        },
    );

    logger.info(
        {
            name: "tariffs:hourly",
            repeat,
            queue: "tariffs-queue",
        },
        "Registered hourly tariffs job",
    );

    await queue.close();
};

try {
    await main();
} catch (err) {
    logger.error({ err }, "Failed to register hourly tariffs job");
    await queue.close();
    process.exit(1);
}
