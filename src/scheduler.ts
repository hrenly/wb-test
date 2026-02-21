import env from "@/config/env/env.js";
import {
    createTariffsJobOptions,
    createTariffsQueue,
} from "@/queues/tariffs-queue.js";
import logger from "@/utils/logger.js";

const queue = createTariffsQueue();

const date = new Date().toISOString().slice(0, 10);

await queue.add(
    "getTariffs",
    { date },
    createTariffsJobOptions(),
);

await queue.close();

logger.info(
    { date, queue: env.WB_TARIFFS_QUEUE_NAME },
    "Scheduled tariffs job",
);
