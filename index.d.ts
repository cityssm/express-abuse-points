import type * as express from "express";
import type * as types from "./types";
export declare const initialize: (options_user?: types.AbuseCheckOptions) => void;
export declare const clearAbuse: (req: types.AbuseRequest) => void;
export declare const isAbuser: (req: types.AbuseRequest) => Promise<boolean>;
export declare const recordAbuse: (req: types.AbuseRequest, abusePoints?: number, expiryMillis?: number) => void;
export declare const abuseCheck: (options_user?: types.AbuseCheckOptions) => express.RequestHandler;
