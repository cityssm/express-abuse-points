import type express from 'express';
import type { AbuseCheckOptions } from './types.js';
/**
 * Cleans up handler.
 */
export declare function shutdown(): void;
/**
 * Initializes the middleware.
 * @param optionsUser - The options.
 * @returns The Express middleware.
 */
export declare function initialize(optionsUser?: Partial<AbuseCheckOptions>): express.RequestHandler;
/**
 * Clears all abuse records from a requestor, expired or not.
 * @param request - The Express request.
 */
export declare function clearAbuse(request: Partial<express.Request>): void;
/**
 * Checks if the current requestor is considered from an abusive source.
 * @param request - The Express request.
 * @returns `true` if the requestor is considered an abusive source.
 */
export declare function isAbuser(request: Partial<express.Request>): boolean;
/**
 * Adds a new abuse record.
 * @param request - The Express request.
 * @param abusePoints - The number of abuse points to apply.
 * @param expiryMillis - The length of time in milliseconds until the abuse points expire.
 */
export declare function recordAbuse(request: Partial<express.Request>, abusePoints?: number, expiryMillis?: number): void;
/**
 * Middleware setup function.
 * @param optionsUser - The options.
 * @returns - The middleware handler function.
 */
export declare function abuseCheck(optionsUser?: AbuseCheckOptions): express.RequestHandler;
declare const _default: {
    initialize: typeof initialize;
    shutdown: typeof shutdown;
    recordAbuse: typeof recordAbuse;
    isAbuser: typeof isAbuser;
    clearAbuse: typeof clearAbuse;
    abuseCheck: typeof abuseCheck;
};
export default _default;
