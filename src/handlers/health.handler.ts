import type { RouteHandlerMethod } from "fastify";

export const createHealthHandler = (): RouteHandlerMethod => {
    return async () => ({ ok: true });
};
