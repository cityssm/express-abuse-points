export interface AbuseCheckOptions {
    byIP?: boolean;
    byXForwardedFor?: boolean;
    abusePoints?: number;
    expiryMillis?: number;
    abusePointsMax?: number;
    clearIntervalMillis?: number;
}
export interface AbuseRequest {
    ip?: string;
    headers?: {
        "x-forwarded-for"?: string;
        [headerName: string]: string | string[];
    };
}
