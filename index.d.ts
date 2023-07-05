import type express from 'express';
import type * as types from './types';
export declare function shutdown(): void;
export declare function initialize(optionsUser?: Partial<types.AbuseCheckOptions>): express.RequestHandler;
export declare function clearAbuse(request: Partial<express.Request>): void;
export declare function isAbuser(request: Partial<express.Request>): Promise<boolean>;
export declare function recordAbuse(request: Partial<express.Request>, abusePoints?: number, expiryMillis?: number): void;
export declare function abuseCheck(optionsUser?: types.AbuseCheckOptions): express.RequestHandler;
