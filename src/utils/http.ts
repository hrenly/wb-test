export type HttpError = Error & { status?: number; body?: string };

export const buildHttpError = async (response: Response) => {
    const errorBody = await response.text();
    const err = new Error(
        `Request failed: ${response.status} ${response.statusText}`,
    ) as HttpError;
    err.status = response.status;
    err.body = errorBody;
    return err;
};

export const getErrorStatus = (err: unknown, fallback = 500) => {
    if (
        typeof err === "object" &&
        err !== null &&
        "status" in err &&
        typeof (err as { status?: number }).status === "number"
    ) {
        return (err as { status?: number }).status as number;
    }

    return fallback;
};
