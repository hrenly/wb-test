import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("wb_tariff_daily", (table) => {
        table.date("tariff_date").notNullable();
        table
            .bigInteger("warehouse_id")
            .notNullable()
            .references("id")
            .inTable("wb_warehouse")
            .onDelete("RESTRICT");

        table.date("dt_till_max").nullable();
        table.timestamp("fetched_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

        table.decimal("box_delivery_base", 14, 4).nullable();
        table.integer("box_delivery_coef_expr").nullable();
        table.decimal("box_delivery_liter", 14, 4).nullable();

        table.decimal("box_delivery_mp_base", 14, 4).nullable();
        table.integer("box_delivery_mp_coef_expr").nullable();
        table.decimal("box_delivery_mp_liter", 14, 4).nullable();

        table.decimal("box_storage_base", 14, 4).nullable();
        table.integer("box_storage_coef_expr").nullable();
        table.decimal("box_storage_liter", 14, 4).nullable();

        table.jsonb("source_payload").notNullable();

        table.primary(["tariff_date", "warehouse_id"], { constraintName: "wb_tariff_daily_pk" });
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("wb_tariff_daily");
}
