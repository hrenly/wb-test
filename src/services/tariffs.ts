import env from "@/config/env/env.js";
import { buildHttpError } from "@/utils/http.js";

import type { WbTariffsResponse } from "@/types/wb-tariffs.js";

const buildTariffsUrl = (date: string) => {
    const url = new URL(env.WB_TARIFFS_BOX_URL);
    url.searchParams.set("date", date);
    return url.toString();
};

export const fetchTariffs = async (date: string): Promise<WbTariffsResponse> => {
    const response = await fetch(buildTariffsUrl(date), {
        method: "GET",
        headers: {
            Authorization: env.WB_TARIFFS_AUTH_TOKEN,
            "content-type": "application/json",
        },
    });

    if (!response.ok) {
        throw await buildHttpError(response);
    }

    return response.json() as Promise<WbTariffsResponse>;
};
