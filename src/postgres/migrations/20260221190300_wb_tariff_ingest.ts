import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("wb_tariff_ingest", (table) => {
        table.bigIncrements("id").primary();
        table.timestamp("fetched_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.jsonb("payload").notNullable();
        table.text("status").notNullable().defaultTo("ok");
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("wb_tariff_ingest");
}
