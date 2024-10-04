import { isIPv6 } from 'is-ip';
// eslint-disable-next-line security/detect-unsafe-regex
const IPV4_WITH_PORT_REGEX = /^(?:[12]?\d{1,2}\.){3}[12]?\d{1,2}(?::\d{1,5})?$/;
/**
 * Tests if an IP address is an IPV4 address with port.
 * @param ipAddress - An IP address
 * @returns `true` if the IP address is an IPV4 address with port.
 */
export function isIP4AddressWithPort(ipAddress) {
    return IPV4_WITH_PORT_REGEX.test(ipAddress);
}
/**
 * Gets the requesting IP address from the request.
 * @param request - The Express request.
 * @returns The IP address, if available.
 */
export function getIP(request) {
    return request.ip ?? '';
}
/**
 * Gets the requesting IP address from the X-Forwarded-For header.
 * @param request - The Express request.
 * @returns The IP address, if available.
 */
export function getXForwardedFor(request) {
    const ipAddresses = request.headers?.['x-forwarded-for'] ?? '';
    // Search for an IP address
    const ipAddressesSplit = typeof ipAddresses === 'string' ? ipAddresses.split(/[ ,[\]]/) : ipAddresses;
    for (const ipPiece of ipAddressesSplit) {
        if (isIP4AddressWithPort(ipPiece)) {
            // Strip off possible port
            return ipPiece.split(':')[0];
        }
        else if (isIPv6(ipPiece)) {
            return ipPiece;
        }
    }
    return ipAddresses.toString();
}
