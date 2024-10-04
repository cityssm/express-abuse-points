import type { Request } from 'express';
export declare function isIP4AddressWithPort(ipAddress: string): boolean;
export declare function getIP(request: Partial<Request>): string;
export declare function getXForwardedFor(request: Partial<Request>): string;
