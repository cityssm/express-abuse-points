const IPV4_WITH_PORT_REGEX = /^([12]?\d{1,2}\.){3}[12]?\d{1,2}(:\d{1,5})?$/;
export const isIP4AddressWithPort = (ipAddress) => {
    return IPV4_WITH_PORT_REGEX.test(ipAddress);
};
const IPV6 = /^([\d:a-f]+:+)+[\da-f]+$/;
export const isIP6Address = (ipAddress) => {
    return ipAddress.length <= 39 && IPV6.test(ipAddress);
};
export const getIP = (request) => {
    return request.ip || "";
};
export const getXForwardedFor = (request) => {
    if (request.headers) {
        const ipAddresses = request.headers["x-forwarded-for"] || "";
        const ipAddressesSplit = ipAddresses.split(/[ ,[\]]/g);
        for (const ipPiece of ipAddressesSplit) {
            if (isIP4AddressWithPort(ipPiece)) {
                return ipPiece.split(":")[0];
            }
            else if (isIP6Address(ipPiece)) {
                return ipPiece;
            }
        }
        return ipAddresses;
    }
    return "";
};
