import type { Request } from 'express';
export declare const isIP4AddressWithPort: (ipAddress: string) => boolean;
export declare const isIP6Address: (ipAddress: string) => boolean;
export declare const getIP: (request: Partial<Request>) => string;
export declare const getXForwardedFor: (request: Partial<Request>) => string;
