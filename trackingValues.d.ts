import type * as types from "./types";
export declare const isIP4Address: (ipAddress: string) => boolean;
export declare const getIP: (req: types.AbuseRequest) => string;
export declare const getXForwardedFor: (req: types.AbuseRequest) => string;
