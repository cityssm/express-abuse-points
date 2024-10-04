import type { Request } from 'express';
/**
 * Tests if an IP address is an IPV4 address with port.
 * @param ipAddress - An IP address
 * @returns `true` if the IP address is an IPV4 address with port.
 */
export declare function isIP4AddressWithPort(ipAddress: string): boolean;
/**
 * Gets the requesting IP address from the request.
 * @param request - The Express request.
 * @returns The IP address, if available.
 */
export declare function getIP(request: Partial<Request>): string;
/**
 * Gets the requesting IP address from the X-Forwarded-For header.
 * @param request - The Express request.
 * @returns The IP address, if available.
 */
export declare function getXForwardedFor(request: Partial<Request>): string;
