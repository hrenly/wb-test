import type { FastifyInstance, RouteHandlerMethod } from "fastify";

type RegisterRoutesDeps = {
    healthHandler: RouteHandlerMethod;
    getTariffsHandler: RouteHandlerMethod;
};

export const registerRoutes = (
    app: FastifyInstance,
    { healthHandler, getTariffsHandler }: RegisterRoutesDeps,
) => {
    app.get("/api/v1/health", healthHandler);
    app.get("/api/v1/getTariffs", getTariffsHandler);
};
