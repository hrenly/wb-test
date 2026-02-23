import crypto from "crypto";

import type { sheets_v4 } from "googleapis";
import type { Knex } from "knex";

import env from "@/config/env/env.js";
import {
    fetchTargetById,
    fetchTariffsForDate,
    updateTargetSync,
} from "@/postgres/sheets.repo.js";

export type SheetsExportJobPayload = {
    targetId: number;
    tariffDate: string;
    sourceFetchedAt: string;
};

const formatDateCell = (value: string | Date | null) => {
    if (!value) return "";
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return value;
};

const formatTimestampCell = (value: Date | null) => {
    if (!value) return "";
    return value.toISOString();
};

const normalizeCell = (value: string | number | null) => {
    if (value === null || value === undefined) return "";
    return value;
};

const buildRows = (rows: Awaited<ReturnType<typeof fetchTariffsForDate>>) => {
    const header = [
        "tariff_date",
        "warehouse_name",
        "geo_name",
        "dt_till_max",
        "box_delivery_coef_expr",
        "box_delivery_base",
        "box_delivery_liter",
        "box_delivery_mp_coef_expr",
        "box_delivery_mp_base",
        "box_delivery_mp_liter",
        "box_storage_coef_expr",
        "box_storage_base",
        "box_storage_liter",
        "fetched_at",
    ];

    const data = rows.map((row) => [
        formatDateCell(row.tariff_date),
        normalizeCell(row.warehouse_name),
        normalizeCell(row.geo_name),
        formatDateCell(row.dt_till_max),
        normalizeCell(row.box_delivery_coef_expr),
        normalizeCell(row.box_delivery_base),
        normalizeCell(row.box_delivery_liter),
        normalizeCell(row.box_delivery_mp_coef_expr),
        normalizeCell(row.box_delivery_mp_base),
        normalizeCell(row.box_delivery_mp_liter),
        normalizeCell(row.box_storage_coef_expr),
        normalizeCell(row.box_storage_base),
        normalizeCell(row.box_storage_liter),
        formatTimestampCell(row.fetched_at),
    ]);

    return [header, ...data];
};

const hashRows = (rows: unknown[]) => {
    return crypto.createHash("sha256").update(JSON.stringify(rows)).digest("hex");
};

const clearSheet = async (sheets: sheets_v4.Sheets, spreadsheetId: string) => {
    if (!env.SHEETS_TARIFFS_SHEET_NAME) {
        throw new Error("SHEETS_TARIFFS_SHEET_NAME is not configured");
    }
    await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${env.SHEETS_TARIFFS_SHEET_NAME}!A:Z`,
    });
};

const updateSheet = async (
    sheets: sheets_v4.Sheets,
    spreadsheetId: string,
    values: unknown[][],
) => {
    if (!env.SHEETS_TARIFFS_SHEET_NAME) {
        throw new Error("SHEETS_TARIFFS_SHEET_NAME is not configured");
    }
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${env.SHEETS_TARIFFS_SHEET_NAME}!A1`,
        valueInputOption: "RAW",
        requestBody: {
            values,
        },
    });
};

export const runSheetsExport = async (
    knex: Knex,
    sheets: sheets_v4.Sheets,
    payload: SheetsExportJobPayload,
) => {
    const target = await fetchTargetById(knex, payload.targetId);
    if (!target) {
        throw new Error(`Sheets target not found: ${payload.targetId}`);
    }

    if (!target.enabled) {
        return { status: "skipped", reason: "disabled" };
    }

    const rows = await fetchTariffsForDate(knex, payload.tariffDate);
    const values = buildRows(rows);
    const hash = hashRows(values);

    await clearSheet(sheets, target.spreadsheet_id);
    await updateSheet(sheets, target.spreadsheet_id, values);

    await updateTargetSync(
        knex,
        target.id,
        new Date(payload.sourceFetchedAt),
        hash,
    );

    return { status: "ok", rows: rows.length };
};
