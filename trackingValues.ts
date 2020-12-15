import type * as types from "./types";

const IP4_REGEX = /^([12]?\d{1,2}\.){3}[12]?\d{1,2}$/;

export const isIP4Address = (ipAddress: string) => {
  return IP4_REGEX.test(ipAddress);
};


export const getIP = (req: types.AbuseRequest) => {
  return req.ip;
};


export const getXForwardedFor = (req: types.AbuseRequest) => {

  if (req.headers) {

    const ipAddress = req.headers["x-forwarded-for"] || "";


    // Search for an IP4 address

    const ipAddressSplit = ipAddress.split(/[ ,:]/g);

    for (const ipPiece of ipAddressSplit) {

      if (isIP4Address(ipPiece)) {
        return ipPiece;
      }
    }

    return ipAddress;
  }

  return "";
};
