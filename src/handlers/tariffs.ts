import type { RouteHandlerMethod } from "fastify";

import { getErrorStatus } from "@/utils/http.js";

type TariffsHandlerDeps = {
    enqueueTariffsJob: (date: string) => Promise<void>;
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const extractDateParam = (query: unknown) => {
    if (
        typeof query === "object" &&
        query !== null &&
        "date" in query
    ) {
        return String((query as { date?: string }).date ?? "");
    }
    return "";
};

export const createGetTariffsHandler = (
    { enqueueTariffsJob }: Pick<TariffsHandlerDeps, "enqueueTariffsJob">,
): RouteHandlerMethod => {
    return async (request, reply) => {
        const date = extractDateParam(request.query);
        const targetDate = date || new Date().toISOString().slice(0, 10);

        if (!DATE_REGEX.test(targetDate)) {
            reply.status(400);
            return {
                error: "Invalid date format. Expected YYYY-MM-DD.",
            };
        }

        try {
            await enqueueTariffsJob(targetDate);
            return { ok: true };
        } catch (err) {
            reply.status(getErrorStatus(err));
            return { error: "Failed to fetch tariffs" };
        }
    };
};
