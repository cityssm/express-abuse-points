export interface AbuseCheckOptions {
    byIP: boolean;
    byXForwardedFor: boolean;
    abusePoints: number;
    expiryMillis: number;
    abusePointsMax: number;
    clearIntervalMillis: number;
}
