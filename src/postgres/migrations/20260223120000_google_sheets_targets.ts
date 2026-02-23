import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("google_sheets_targets", (table) => {
        table.bigIncrements("id").primary();
        table.text("spreadsheet_id").notNullable();
        table.boolean("enabled").notNullable().defaultTo(true);
        table.timestamp("last_sync_at", { useTz: true }).nullable();
        table.timestamp("last_source_fetched_at", { useTz: true }).nullable();
        table.text("last_sync_hash").nullable();
        table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("google_sheets_targets");
}
