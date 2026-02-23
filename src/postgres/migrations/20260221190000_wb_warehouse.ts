import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("wb_warehouse", (table) => {
        table.bigIncrements("id").primary();
        table.text("name").notNullable();
        table.text("geo_name").nullable();
        table.text("name_norm").notNullable();
        table.text("geo_name_norm").notNullable();
        table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.unique(["name_norm", "geo_name_norm"], { indexName: "wb_warehouse_name_geo_name_norm_uk" });
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("wb_warehouse");
}
