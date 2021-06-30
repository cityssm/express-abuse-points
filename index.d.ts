import express from "express";
import type * as types from "./types";
export declare const shutdown: () => void;
export declare const initialize: (options_user?: types.AbuseCheckOptions) => void;
export declare const clearAbuse: (request: types.AbuseRequest) => void;
export declare const isAbuser: (request: types.AbuseRequest) => Promise<boolean>;
export declare const recordAbuse: (request: types.AbuseRequest, abusePoints?: number, expiryMillis?: number) => void;
export declare const abuseCheck: (options_user?: types.AbuseCheckOptions) => express.RequestHandler;
