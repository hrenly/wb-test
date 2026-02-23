import { google } from "googleapis";
import { readFile } from "node:fs/promises";

import env from "@/config/env/env.js";

const SHEETS_SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const loadCredentials = async () => {
    if (env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        return JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
    }

    if (env.GOOGLE_APPLICATION_CREDENTIALS) {
        const raw = await readFile(env.GOOGLE_APPLICATION_CREDENTIALS, "utf-8");
        return JSON.parse(raw);
    }

    throw new Error("Google credentials are not configured");
};

export const createSheetsClient = async () => {
    const credentials = await loadCredentials();

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: SHEETS_SCOPES,
    });

    return google.sheets({ version: "v4", auth });
};
