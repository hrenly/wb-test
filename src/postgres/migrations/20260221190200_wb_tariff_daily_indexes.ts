import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("wb_tariff_daily", (table) => {
        table.index(["tariff_date"], "wb_tariff_daily_date_idx");
        table.index(["warehouse_id"], "wb_tariff_daily_warehouse_idx");
        table.index(["warehouse_id", "tariff_date"], "wb_tariff_daily_wh_date_idx");
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("wb_tariff_daily", (table) => {
        table.dropIndex(["tariff_date"], "wb_tariff_daily_date_idx");
        table.dropIndex(["warehouse_id"], "wb_tariff_daily_warehouse_idx");
        table.dropIndex(["warehouse_id", "tariff_date"], "wb_tariff_daily_wh_date_idx");
    });
}
