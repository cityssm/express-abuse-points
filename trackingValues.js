const IPV4_WITH_PORT_REGEX = /^([12]?\d{1,2}\.){3}[12]?\d{1,2}(:\d{1,5})?$/;
export const isIP4AddressWithPort = (ipAddress) => {
    return IPV4_WITH_PORT_REGEX.test(ipAddress);
};
const IPV6 = /^([\d:a-f]+:+)+[\da-f]+$/;
export const isIP6Address = (ipAddress) => {
    return ipAddress.length <= 39 && IPV6.test(ipAddress);
};
export const getIP = (request) => {
    var _a;
    return (_a = request.ip) !== null && _a !== void 0 ? _a : '';
};
export const getXForwardedFor = (request) => {
    var _a, _b;
    const ipAddresses = (_b = (_a = request.headers) === null || _a === void 0 ? void 0 : _a['x-forwarded-for']) !== null && _b !== void 0 ? _b : '';
    const ipAddressesSplit = typeof ipAddresses === 'string'
        ? ipAddresses.split(/[ ,[\]]/g)
        : ipAddresses;
    for (const ipPiece of ipAddressesSplit) {
        if (isIP4AddressWithPort(ipPiece)) {
            return ipPiece.split(':')[0];
        }
        else if (isIP6Address(ipPiece)) {
            return ipPiece;
        }
    }
    return ipAddresses.toString();
};
