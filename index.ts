import type { RequestHandler } from "express";

export const abuseCheck = (options): RequestHandler {

  return (req, res, next) => {

    next();
  };
};
