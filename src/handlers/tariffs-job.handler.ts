import type { Knex } from "knex";

import {
    buildTariffUpserts,
    buildTariffsServiceResult,
    fetchAndNormalizeTariffs,
    filterChangedTariffs,
} from "@/services/tariffs-processing.service.js";
import {
    fetchExistingTariffs,
    insertTariffIngest,
    upsertTariffDaily,
    upsertWarehouses,
} from "@/postgres/tariffs.repo.js";

export type TariffsJobPayload = {
    date?: string;
};

export const createTariffsJobHandler = (knex: Knex) => {
    return async ({ date }: TariffsJobPayload) => {
        const targetDate = date ?? new Date().toISOString().slice(0, 10);
        const normalized = await fetchAndNormalizeTariffs(targetDate);

        return knex.transaction(async (trx) => {
            await insertTariffIngest(trx, normalized.raw, "ok");

            const warehouseIdByKey = await upsertWarehouses(trx, normalized.warehouses);
            const tariffRows = buildTariffUpserts(targetDate, normalized.tariffs, warehouseIdByKey, trx);

            const existing = await fetchExistingTariffs(
                trx,
                targetDate,
                tariffRows.map((row) => row.warehouse_id),
            );

            const changed = filterChangedTariffs(tariffRows, existing);
            await upsertTariffDaily(trx, changed);

            return buildTariffsServiceResult(tariffRows.length, changed.length);
        });
    };
};
