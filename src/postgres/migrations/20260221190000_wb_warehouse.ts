import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("wb_warehouse", (table) => {
        table.bigIncrements("id").primary();
        table.text("name").notNullable();
        table.text("geo_name").nullable();
        table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.unique(["name", "geo_name"], { indexName: "wb_warehouse_name_geo_name_uk" });
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("wb_warehouse");
}
