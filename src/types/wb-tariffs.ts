export type WbTariffValue = string;

export type WbTariffWarehouseItem = {
    boxDeliveryBase: WbTariffValue;
    boxDeliveryCoefExpr: WbTariffValue;
    boxDeliveryLiter: WbTariffValue;
    boxDeliveryMarketplaceBase: WbTariffValue;
    boxDeliveryMarketplaceCoefExpr: WbTariffValue;
    boxDeliveryMarketplaceLiter: WbTariffValue;
    boxStorageBase: WbTariffValue;
    boxStorageCoefExpr: WbTariffValue;
    boxStorageLiter: WbTariffValue;
    geoName: string;
    warehouseName: string;
};

export type WbTariffsData = {
    dtNextBox: string;
    dtTillMax: string;
    warehouseList: WbTariffWarehouseItem[];
};

export type WbTariffsResponse = {
    response: {
        data: WbTariffsData;
    };
};
