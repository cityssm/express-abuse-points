import type express from 'express';
import type { AbuseCheckOptions } from './types.js';
export declare function shutdown(): void;
export declare function initialize(optionsUser?: Partial<AbuseCheckOptions>): express.RequestHandler;
export declare function clearAbuse(request: Partial<express.Request>): void;
export declare function isAbuser(request: Partial<express.Request>): boolean;
export declare function recordAbuse(request: Partial<express.Request>, abusePoints?: number, expiryMillis?: number): void;
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
