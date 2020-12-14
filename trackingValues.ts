import type * as types from "./types";


export const getIP = (req: types.AbuseRequest) => {
  return req.ip;
};
