import type * as express from "express";
import type * as types from "./types";

import * as trackingValues from "./trackingValues";
import * as sqlite3 from "sqlite3";


const OPTIONS_DEFAULT: types.AbuseCheckOptions = {
  "byIP": true,
  "byXForwardedFor": false,

  "abusePoints": 1,
  "expiryMillis": 5 * 60 * 1000, // 5 minutes

  "abusePointsMax": 10,
  "clearIntervalMillis": 60 * 60 * 1000 // 1 hour
};
Object.freeze(OPTIONS_DEFAULT);


const TABLENAME_IP = "AbusePoints_IP";
const TABLENAME_XFORWARDEDFOR = "AbusePoints_XForwardedFor";

const TABLECOLUMNS_CREATE = "(trackingValue TEXT, expiryTimeMillis INT UNSIGNED, abusePoints TINYINT UNSIGNED)";
const TABLECOLUMNS_INSERT = "(trackingValue, expiryTimeMillis, abusePoints)";


let options: types.AbuseCheckOptions = OPTIONS_DEFAULT;
let db: sqlite3.Database;


export const initialize = (options_user?: types.AbuseCheckOptions) => {

  options = Object.assign({}, OPTIONS_DEFAULT, options_user);

  if (!db) {
    db = new sqlite3.Database(":memory:");

    if (options.byIP) {
      db.run("CREATE TABLE IF NOT EXISTS " + TABLENAME_IP +
        " " + TABLECOLUMNS_CREATE);
    }

    if (options.byXForwardedFor) {
      db.run("CREATE TABLE IF NOT EXISTS " + TABLENAME_XFORWARDEDFOR +
        " " + TABLECOLUMNS_CREATE);
    }
  }
};


const clearExpiredAbuse = () => {
  if (options.byIP) {
    db.run("DELETE FROM " + TABLENAME_IP +
      " WHERE expiryTimeMillis <= ?",
      Date.now());
  }

  if (options.byXForwardedFor) {
    db.run("DELETE FROM " + TABLENAME_XFORWARDEDFOR +
      " WHERE expiryTimeMillis <= ?",
      Date.now());
  }
};


const getAbusePoints = async (tableName: string, trackingValue: string) => {

  return await new Promise((resolve, reject) => {

    db.get("select sum(abusePoints) as abusePointsSum" +
      " from " + tableName +
      " where trackingValue = ?" +
      " and expiryTimeMillis > ?",
      trackingValue,
      Date.now(),
      (err, row: { abusePointsSum?: number }) => {

        if (err) {
          reject(err);
        }

        if (row?.abusePointsSum) {
          resolve(row.abusePointsSum || 0);
        }

        resolve(0);
      }
    );
  });
};


const clearAbusePoints = (tableName: string, trackingValue: string) => {
  db.run("delete from " + tableName +
    " where trackingValue = ?",
    trackingValue
  );
};


/**
 * Clears all abuse records from a requestor, expired or not.
 */
export const clearAbuse = (req: types.AbuseRequest) => {
  if (options.byIP) {
    const ipAddress = trackingValues.getIP(req);

    if (ipAddress !== "") {
      clearAbusePoints(TABLENAME_IP, ipAddress);
    }
  }

  if (options.byXForwardedFor) {
    const ipAddress = trackingValues.getXForwardedFor(req);

    if (ipAddress !== "") {
      clearAbusePoints(TABLENAME_XFORWARDEDFOR, ipAddress);
    }
  }
};


/**
 * Checks if the current requestor is considered from an abusive source.
 */
export const isAbuser = async (req: types.AbuseRequest) => {

  if (options.byIP) {

    const ipAddress = trackingValues.getIP(req);

    if (ipAddress !== "") {
      const abusePoints = await getAbusePoints(TABLENAME_IP, ipAddress);

      if (abusePoints >= options.abusePointsMax) {
        return true;
      }
    }
  }

  if (options.byXForwardedFor) {

    const ipAddress = trackingValues.getXForwardedFor(req);

    if (ipAddress !== "") {
      const abusePoints = await getAbusePoints(TABLENAME_XFORWARDEDFOR, ipAddress);

      if (abusePoints >= options.abusePointsMax) {
        return true;
      }
    }
  }

  return false;
};


/**
 * Adds a new abuse record.
 */
export const recordAbuse = (req: types.AbuseRequest, abusePoints: number = options.abusePoints, expiryMillis: number = options.expiryMillis) => {

  const expiryTimeMillis = Date.now() + expiryMillis;

  if (options.byIP) {
    const ipAddress = trackingValues.getIP(req);

    if (ipAddress !== "") {
      db.run("INSERT INTO " + TABLENAME_IP + " " + TABLECOLUMNS_INSERT + " values (?, ?, ?)",
        ipAddress,
        expiryTimeMillis,
        abusePoints);
    }
  }

  if (options.byXForwardedFor) {
    const ipAddress = trackingValues.getXForwardedFor(req);

    if (ipAddress !== "") {
      db.run("INSERT INTO " + TABLENAME_XFORWARDEDFOR + " " + TABLECOLUMNS_INSERT + " values (?, ?, ?)",
        ipAddress,
        expiryTimeMillis,
        abusePoints);
    }
  }
};


/**
 * Middleware setup function
 */
export const abuseCheck = (options_user?: types.AbuseCheckOptions): express.RequestHandler => {

  initialize(options_user);

  setInterval(clearExpiredAbuse, options.clearIntervalMillis);

  const handler: express.RequestHandler = async (req, res, next) => {

    const isRequestAbuser = await isAbuser(req);

    if (isRequestAbuser) {
      res.status(403)
        .send("Access temporarily restricted.");

      res.end();
    } else {
      next();
    }
  };

  return handler;
};
