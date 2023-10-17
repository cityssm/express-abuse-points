import { isIPv6 } from 'is-ip';
const IPV4_WITH_PORT_REGEX = /^(?:[12]?\d{1,2}\.){3}[12]?\d{1,2}(?::\d{1,5})?$/;
export const isIP4AddressWithPort = (ipAddress) => {
    return IPV4_WITH_PORT_REGEX.test(ipAddress);
};
export const getIP = (request) => {
    return request.ip ?? '';
};
export const getXForwardedFor = (request) => {
    const ipAddresses = request.headers?.['x-forwarded-for'] ?? '';
    const ipAddressesSplit = typeof ipAddresses === 'string' ? ipAddresses.split(/[ ,[\]]/) : ipAddresses;
    for (const ipPiece of ipAddressesSplit) {
        if (isIP4AddressWithPort(ipPiece)) {
            return ipPiece.split(':')[0];
        }
        else if (isIPv6(ipPiece)) {
            return ipPiece;
        }
    }
    return ipAddresses.toString();
};
