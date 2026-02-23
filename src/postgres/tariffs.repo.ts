import type { Knex } from "knex";

export type WarehouseUpsertInput = {
    name: string;
    geo_name: string | null;
    name_norm: string;
    geo_name_norm: string;
};

export type TariffDailyUpsertInput = {
    tariff_date: string;
    warehouse_id: number;
    dt_till_max: string | null;
    fetched_at: Knex.Raw;

    box_delivery_base: string | null;
    box_delivery_coef_expr: number | null;
    box_delivery_liter: string | null;

    box_delivery_mp_base: string | null;
    box_delivery_mp_coef_expr: number | null;
    box_delivery_mp_liter: string | null;

    box_storage_base: string | null;
    box_storage_coef_expr: number | null;
    box_storage_liter: string | null;

    source_payload: unknown;
};

export type TariffDailyRow = {
    tariff_date: string;
    warehouse_id: number;
    dt_till_max: string | null;

    box_delivery_base: string | null;
    box_delivery_coef_expr: number | null;
    box_delivery_liter: string | null;

    box_delivery_mp_base: string | null;
    box_delivery_mp_coef_expr: number | null;
    box_delivery_mp_liter: string | null;

    box_storage_base: string | null;
    box_storage_coef_expr: number | null;
    box_storage_liter: string | null;
};

export const insertTariffIngest = async (
    trx: Knex.Transaction,
    payload: unknown,
    status: string,
) => {
    await trx("wb_tariff_ingest").insert({
        fetched_at: trx.fn.now(),
        payload,
        status,
    });
};

export const upsertWarehouses = async (
    trx: Knex.Transaction,
    warehouses: WarehouseUpsertInput[],
) => {
    if (warehouses.length === 0) {
        return new Map<string, number>();
    }

    const rows = await trx("wb_warehouse")
        .insert(warehouses)
        .onConflict(["name_norm", "geo_name_norm"])
        .merge({
            name: trx.raw("excluded.name"),
            geo_name: trx.raw("excluded.geo_name"),
        })
        .returning(["id", "name_norm", "geo_name_norm"]);

    const map = new Map<string, number>();
    for (const row of rows) {
        map.set(`${row.name_norm}|${row.geo_name_norm}`, row.id);
    }
    return map;
};

export const fetchExistingTariffs = async (
    trx: Knex.Transaction,
    tariffDate: string,
    warehouseIds: number[],
): Promise<TariffDailyRow[]> => {
    if (warehouseIds.length === 0) {
        return [];
    }

    return trx("wb_tariff_daily")
        .select(
            "tariff_date",
            "warehouse_id",
            "dt_till_max",
            "box_delivery_base",
            "box_delivery_coef_expr",
            "box_delivery_liter",
            "box_delivery_mp_base",
            "box_delivery_mp_coef_expr",
            "box_delivery_mp_liter",
            "box_storage_base",
            "box_storage_coef_expr",
            "box_storage_liter",
        )
        .where("tariff_date", tariffDate)
        .whereIn("warehouse_id", warehouseIds);
};

export const upsertTariffDaily = async (
    trx: Knex.Transaction,
    rows: TariffDailyUpsertInput[],
) => {
    if (rows.length === 0) {
        return;
    }

    await trx("wb_tariff_daily")
        .insert(rows)
        .onConflict(["tariff_date", "warehouse_id"])
        .merge({
            dt_till_max: trx.raw("excluded.dt_till_max"),
            fetched_at: trx.raw("excluded.fetched_at"),
            box_delivery_base: trx.raw("excluded.box_delivery_base"),
            box_delivery_coef_expr: trx.raw("excluded.box_delivery_coef_expr"),
            box_delivery_liter: trx.raw("excluded.box_delivery_liter"),
            box_delivery_mp_base: trx.raw("excluded.box_delivery_mp_base"),
            box_delivery_mp_coef_expr: trx.raw("excluded.box_delivery_mp_coef_expr"),
            box_delivery_mp_liter: trx.raw("excluded.box_delivery_mp_liter"),
            box_storage_base: trx.raw("excluded.box_storage_base"),
            box_storage_coef_expr: trx.raw("excluded.box_storage_coef_expr"),
            box_storage_liter: trx.raw("excluded.box_storage_liter"),
            source_payload: trx.raw("excluded.source_payload"),
        });
};
