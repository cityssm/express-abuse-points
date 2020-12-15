"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getXForwardedFor = exports.getIP = exports.isIP4Address = void 0;
const IP4_REGEX = /^([12]?\d{1,2}\.){3}[12]?\d{1,2}$/;
const isIP4Address = (ipAddress) => {
    return IP4_REGEX.test(ipAddress);
};
exports.isIP4Address = isIP4Address;
const getIP = (req) => {
    return req.ip;
};
exports.getIP = getIP;
const getXForwardedFor = (req) => {
    if (req.headers) {
        const ipAddress = req.headers["x-forwarded-for"] || "";
        const ipAddressSplit = ipAddress.split(/[ ,:]/g);
        for (const ipPiece of ipAddressSplit) {
            if (exports.isIP4Address(ipPiece)) {
                return ipPiece;
            }
        }
        return ipAddress;
    }
    return "";
};
exports.getXForwardedFor = getXForwardedFor;
