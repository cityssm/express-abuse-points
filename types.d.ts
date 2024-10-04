/**
 * Options when initializing the middleware.
 */
export interface AbuseCheckOptions {
    /**
     * Whether abuse points should be tracked by IP address.
     */
    byIP: boolean;
    /**
     * Whether abuse points should be tracked by the X-Forwarded-For header.
     */
    byXForwardedFor: boolean;
    /**
     * The default number of points assigned to an abuse event.
     */
    abusePoints: number;
    /**
     * The default number of milliseconds an abuse record is enforced before expiring.
     */
    expiryMillis: number;
    /**
     * The total number of points a user can accumulate before being blocked.
     */
    abusePointsMax: number;
    /**
     * The frequency the memory is cleared of expired abuse records.
     */
    clearIntervalMillis: number;
}
