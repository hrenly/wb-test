import type { Knex } from "knex";

export type SheetsTargetRow = {
    id: number;
    spreadsheet_id: string;
    enabled: boolean;
    last_sync_at: Date | null;
    last_source_fetched_at: Date | null;
    last_sync_hash: string | null;
};

export type TariffExportRow = {
    tariff_date: string;
    warehouse_name: string;
    geo_name: string | null;
    dt_till_max: string | null;
    box_delivery_coef_expr: number | null;
    box_delivery_base: string | null;
    box_delivery_liter: string | null;
    box_delivery_mp_coef_expr: number | null;
    box_delivery_mp_base: string | null;
    box_delivery_mp_liter: string | null;
    box_storage_coef_expr: number | null;
    box_storage_base: string | null;
    box_storage_liter: string | null;
    fetched_at: Date;
};

export const fetchMaxFetchedAt = async (
    knex: Knex,
    tariffDate: string,
): Promise<Date | null> => {
    const row = await knex("wb_tariff_daily")
        .max("fetched_at as max")
        .where("tariff_date", tariffDate)
        .first();

    return (row?.max as Date | null) ?? null;
};

export const fetchEnabledTargets = async (knex: Knex): Promise<SheetsTargetRow[]> => {
    return knex("google_sheets_targets")
        .select(
            "id",
            "spreadsheet_id",
            "enabled",
            "last_sync_at",
            "last_source_fetched_at",
            "last_sync_hash",
        )
        .where("enabled", true);
};

export const fetchTargetById = async (
    knex: Knex,
    targetId: number,
): Promise<SheetsTargetRow | null> => {
    const row = await knex("google_sheets_targets")
        .select(
            "id",
            "spreadsheet_id",
            "enabled",
            "last_sync_at",
            "last_source_fetched_at",
            "last_sync_hash",
        )
        .where("id", targetId)
        .first();

    return row ?? null;
};

export const updateTargetSync = async (
    knex: Knex,
    targetId: number,
    sourceFetchedAt: Date,
    syncHash: string,
) => {
    await knex("google_sheets_targets")
        .where("id", targetId)
        .update({
            last_sync_at: knex.fn.now(),
            last_source_fetched_at: sourceFetchedAt,
            last_sync_hash: syncHash,
            updated_at: knex.fn.now(),
        });
};

export const fetchTariffsForDate = async (
    knex: Knex,
    tariffDate: string,
): Promise<TariffExportRow[]> => {
    return knex("wb_tariff_daily as td")
        .join("wb_warehouse as w", "w.id", "td.warehouse_id")
        .select(
            "td.tariff_date",
            "w.name as warehouse_name",
            "w.geo_name",
            "td.dt_till_max",
            "td.box_delivery_coef_expr",
            "td.box_delivery_base",
            "td.box_delivery_liter",
            "td.box_delivery_mp_coef_expr",
            "td.box_delivery_mp_base",
            "td.box_delivery_mp_liter",
            "td.box_storage_coef_expr",
            "td.box_storage_base",
            "td.box_storage_liter",
            "td.fetched_at",
        )
        .where("td.tariff_date", tariffDate)
        .orderBy([{ column: "td.box_delivery_coef_expr", order: "asc", nulls: "last" }, { column: "w.name", order: "asc" }]);
};
