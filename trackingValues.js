"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getXForwardedFor = exports.getIP = exports.isIP6Address = exports.isIP4AddressWithPort = void 0;
const IPV4_WITH_PORT_REGEX = /^([12]?\d{1,2}\.){3}[12]?\d{1,2}(:\d{1,5})?$/;
const isIP4AddressWithPort = (ipAddress) => {
    return IPV4_WITH_PORT_REGEX.test(ipAddress);
};
exports.isIP4AddressWithPort = isIP4AddressWithPort;
const IPV6 = /^([a-f0-9:]+:+)+[a-f0-9]+$/;
const isIP6Address = (ipAddress) => {
    return ipAddress.length <= 39 && IPV6.test(ipAddress);
};
exports.isIP6Address = isIP6Address;
const getIP = (req) => {
    return req.ip || "";
};
exports.getIP = getIP;
const getXForwardedFor = (req) => {
    if (req.headers) {
        const ipAddresses = req.headers["x-forwarded-for"] || "";
        const ipAddressesSplit = ipAddresses.split(/[ ,[\]]/g);
        for (const ipPiece of ipAddressesSplit) {
            if (exports.isIP4AddressWithPort(ipPiece)) {
                return ipPiece.split(":")[0];
            }
            else if (exports.isIP6Address(ipPiece)) {
                return ipPiece;
            }
        }
        return ipAddresses;
    }
    return "";
};
exports.getXForwardedFor = getXForwardedFor;
