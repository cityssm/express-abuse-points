import type * as types from "./types";


const IPV4_WITH_PORT_REGEX = /^([12]?\d{1,2}\.){3}[12]?\d{1,2}(:\d{1,5})?$/;

export const isIP4AddressWithPort = (ipAddress: string) => {
  return IPV4_WITH_PORT_REGEX.test(ipAddress);
};


const IPV6 = /^([a-f0-9:]+:+)+[a-f0-9]+$/;

export const isIP6Address = (ipAddress: string) => {
  return IPV6.test(ipAddress);
};


export const getIP = (req: types.AbuseRequest) => {
  return req.ip || "";
};


export const getXForwardedFor = (req: types.AbuseRequest) => {

  if (req.headers) {

    const ipAddresses = req.headers["x-forwarded-for"] || "";

    // Search for an IP address

    const ipAddressesSplit = ipAddresses.split(/[ ,[\]]/g);

    for (const ipPiece of ipAddressesSplit) {

      if (isIP4AddressWithPort(ipPiece)) {
        // Strip off possible port
        return ipPiece.split(":")[0];

      } else if (isIP6Address(ipPiece)) {
        return ipPiece;

      }
    }

    return ipAddresses;
  }

  return "";
};
