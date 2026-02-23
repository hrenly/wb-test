import crypto from "crypto";

import type { Knex } from "knex";

import { fetchTariffs } from "@/services/tariffs.service.js";
import type {
    WbTariffsResponse,
    WbTariffWarehouseItem,
} from "@/types/wb-tariffs.js";
import type {
    TariffDailyRow,
    TariffDailyUpsertInput,
    WarehouseUpsertInput,
} from "@/postgres/tariffs.repo.js";

export type NormalizedTariffItem = Omit<
    TariffDailyUpsertInput,
    "warehouse_id" | "tariff_date" | "fetched_at"
> & {
    warehouse_key: string;
};

export type NormalizedTariffsPayload = {
    raw: WbTariffsResponse;
    warehouses: WarehouseUpsertInput[];
    tariffs: NormalizedTariffItem[];
};

export type TariffsServiceResult = {
    totalWarehouses: number;
    upsertedTariffs: number;
    skippedTariffs: number;
};

const normalizeText = (value: string | null | undefined) => {
    return String(value ?? "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
};

const normalizeKey = (name: string, geoName: string | null) => {
    return `${normalizeText(name)}|${normalizeText(geoName ?? "")}`;
};

const normalizeNullableDate = (value: string | null | undefined) => {
    const normalized = String(value ?? "").trim();
    return normalized === "" ? null : normalized;
};

const parseNullableInteger = (value: string | null | undefined) => {
    const normalized = String(value ?? "").trim();
    if (normalized === "" || normalized === "-") return null;
    const parsed = Number.parseInt(normalized, 10);
    return Number.isNaN(parsed) ? null : parsed;
};

const parseNullableDecimal = (value: string | null | undefined) => {
    const normalized = String(value ?? "").trim();
    if (normalized === "" || normalized === "-") return null;
    const parsed = Number.parseFloat(normalized.replace(/,/g, "."));
    if (!Number.isFinite(parsed)) return null;
    return parsed.toFixed(4);
};

const hashTariff = (row: TariffDailyRow) => {
    const payload = [
        row.dt_till_max ?? null,
        row.box_delivery_base ?? null,
        row.box_delivery_coef_expr ?? null,
        row.box_delivery_liter ?? null,
        row.box_delivery_mp_base ?? null,
        row.box_delivery_mp_coef_expr ?? null,
        row.box_delivery_mp_liter ?? null,
        row.box_storage_base ?? null,
        row.box_storage_coef_expr ?? null,
        row.box_storage_liter ?? null,
    ];

    return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
};

const normalizeExistingRow = (row: TariffDailyRow): TariffDailyRow => {
    const normalizeDecimalRow = (value: string | null) => {
        if (value === null) return null;
        const parsed = Number.parseFloat(value);
        if (!Number.isFinite(parsed)) return null;
        return parsed.toFixed(4);
    };

    return {
        ...row,
        dt_till_max: normalizeNullableDate(row.dt_till_max ?? undefined),
        box_delivery_base: normalizeDecimalRow(row.box_delivery_base),
        box_delivery_liter: normalizeDecimalRow(row.box_delivery_liter),
        box_delivery_mp_base: normalizeDecimalRow(row.box_delivery_mp_base),
        box_delivery_mp_liter: normalizeDecimalRow(row.box_delivery_mp_liter),
        box_storage_base: normalizeDecimalRow(row.box_storage_base),
        box_storage_liter: normalizeDecimalRow(row.box_storage_liter),
    };
};

const buildWarehouseInputs = (items: WbTariffWarehouseItem[]): WarehouseUpsertInput[] => {
    const map = new Map<string, WarehouseUpsertInput>();

    for (const item of items) {
        const name = String(item.warehouseName ?? "");
        if (!name.trim()) {
            throw new Error("WB tariffs payload содержит склад без warehouseName");
        }
        const geoName = item.geoName ?? null;
        const key = normalizeKey(name, geoName ?? null);
        map.set(key, {
            name,
            geo_name: geoName === "" ? null : geoName,
            name_norm: normalizeText(name),
            geo_name_norm: normalizeText(geoName ?? ""),
        });
    }

    return Array.from(map.values());
};

const buildTariffRows = (
    dtTillMax: string | null,
    items: WbTariffWarehouseItem[],
): NormalizedTariffItem[] => {
    const map = new Map<string, NormalizedTariffItem>();

    for (const item of items) {
        const name = String(item.warehouseName ?? "");
        const geoName = item.geoName ?? null;
        const key = normalizeKey(name, geoName ?? null);

        map.set(key, {
            warehouse_key: key,
            dt_till_max: dtTillMax,

            box_delivery_base: parseNullableDecimal(item.boxDeliveryBase),
            box_delivery_coef_expr: parseNullableInteger(item.boxDeliveryCoefExpr),
            box_delivery_liter: parseNullableDecimal(item.boxDeliveryLiter),

            box_delivery_mp_base: parseNullableDecimal(item.boxDeliveryMarketplaceBase),
            box_delivery_mp_coef_expr: parseNullableInteger(item.boxDeliveryMarketplaceCoefExpr),
            box_delivery_mp_liter: parseNullableDecimal(item.boxDeliveryMarketplaceLiter),

            box_storage_base: parseNullableDecimal(item.boxStorageBase),
            box_storage_coef_expr: parseNullableInteger(item.boxStorageCoefExpr),
            box_storage_liter: parseNullableDecimal(item.boxStorageLiter),

            source_payload: item,
        });
    }

    return Array.from(map.values());
};

export const fetchAndNormalizeTariffs = async (
    date: string,
): Promise<NormalizedTariffsPayload> => {
    const response: WbTariffsResponse = await fetchTariffs(date);
    const data = response?.response?.data;

    if (!data || !Array.isArray(data.warehouseList)) {
        throw new Error("WB tariffs payload имеет неожиданный формат");
    }

    const warehouses = buildWarehouseInputs(data.warehouseList);
    const dtTillMax = normalizeNullableDate(data.dtTillMax ?? undefined);

    return {
        raw: response,
        warehouses,
        tariffs: buildTariffRows(dtTillMax, data.warehouseList),
    };
};

export const buildTariffUpserts = (
    tariffDate: string,
    tariffItems: NormalizedTariffItem[],
    warehouseIdByKey: Map<string, number>,
    trx: Knex.Transaction,
): TariffDailyUpsertInput[] => {
    return tariffItems.map((item) => {
        const warehouseId = warehouseIdByKey.get(item.warehouse_key);
        if (!warehouseId) {
            throw new Error(`Не найден warehouse_id для ключа ${item.warehouse_key}`);
        }

        return {
            tariff_date: tariffDate,
            warehouse_id: warehouseId,
            dt_till_max: item.dt_till_max,
            fetched_at: trx.fn.now(),

            box_delivery_base: item.box_delivery_base,
            box_delivery_coef_expr: item.box_delivery_coef_expr,
            box_delivery_liter: item.box_delivery_liter,

            box_delivery_mp_base: item.box_delivery_mp_base,
            box_delivery_mp_coef_expr: item.box_delivery_mp_coef_expr,
            box_delivery_mp_liter: item.box_delivery_mp_liter,

            box_storage_base: item.box_storage_base,
            box_storage_coef_expr: item.box_storage_coef_expr,
            box_storage_liter: item.box_storage_liter,

            source_payload: item.source_payload,
        };
    });
};

export const filterChangedTariffs = (
    nextRows: TariffDailyUpsertInput[],
    existingRows: TariffDailyRow[],
): TariffDailyUpsertInput[] => {
    const existingMap = new Map<string, TariffDailyRow>();

    for (const row of existingRows) {
        existingMap.set(`${row.warehouse_id}`, normalizeExistingRow(row));
    }

    return nextRows.filter((next) => {
        const existing = existingMap.get(`${next.warehouse_id}`);
        if (!existing) return true;

        const nextComparable: TariffDailyRow = {
            tariff_date: next.tariff_date,
            warehouse_id: next.warehouse_id,
            dt_till_max: normalizeNullableDate(next.dt_till_max ?? undefined),

            box_delivery_base: next.box_delivery_base,
            box_delivery_coef_expr: next.box_delivery_coef_expr,
            box_delivery_liter: next.box_delivery_liter,

            box_delivery_mp_base: next.box_delivery_mp_base,
            box_delivery_mp_coef_expr: next.box_delivery_mp_coef_expr,
            box_delivery_mp_liter: next.box_delivery_mp_liter,

            box_storage_base: next.box_storage_base,
            box_storage_coef_expr: next.box_storage_coef_expr,
            box_storage_liter: next.box_storage_liter,
        };

        return hashTariff(existing) !== hashTariff(nextComparable);
    });
};

export const buildTariffsServiceResult = (
    total: number,
    upserted: number,
): TariffsServiceResult => ({
    totalWarehouses: total,
    upsertedTariffs: upserted,
    skippedTariffs: total - upserted,
});
