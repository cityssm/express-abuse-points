export interface AbuseCheckOptions {
    byIP?: boolean;
    abusePoints?: number;
    expiryMillis?: number;
    abusePointsMax?: number;
    clearIntervalMillis?: number;
}
export interface AbuseRequest {
    ip: string;
}
