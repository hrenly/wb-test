import { google } from "googleapis";
import { readFile } from "node:fs/promises";

import env from "@/config/env/env.js";

const SHEETS_SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const loadCredentials = async () => {
    if (!env.GOOGLE_CREDENTIALS_PATH) {
        throw new Error("GOOGLE_CREDENTIALS_PATH is not configured");
    }
    const raw = await readFile(env.GOOGLE_CREDENTIALS_PATH, "utf-8");
    return JSON.parse(raw);
};

export const createSheetsClient = async () => {
    const credentials = await loadCredentials();

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: SHEETS_SCOPES,
    });

    return google.sheets({ version: "v4", auth });
};
