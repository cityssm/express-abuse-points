import type * as express from "express";
import type * as types from "./types";

import * as trackingValues from "./trackingValues";
import * as sqlite3 from "sqlite3";


const OPTIONS_DEFAULT: types.AbuseCheckOptions = {
  "byIP": true,
  "expiryMillis": 5 * 60 * 1000,
  "abusePointsMax": 10,
  "clearIntervalMillis": 60 * 60 * 1000
};
Object.freeze(OPTIONS_DEFAULT);


const TABLENAME_IP = "AbusePoints_IP";

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
  }
};


const clearExpiredAbuse = () => {

  console.log("clear");

  if (options.byIP) {
    db.run("DELETE FROM " + TABLENAME_IP +
      " WHERE expiryTimeMillis <= ?",
      Date.now());
  }
};


const getAbusePoints = async(tableName: string, trackingValue: string) => {

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
    clearAbusePoints(TABLENAME_IP, ipAddress);
  }
};


/**
 * Checks if the current requestor is considered from an abusive source.
 */
export const isAbuser = async(req: types.AbuseRequest) => {

  if (options.byIP) {
    const ipAddress = trackingValues.getIP(req);

    const abusePoints = await getAbusePoints(TABLENAME_IP, ipAddress);

    if (abusePoints >= options.abusePointsMax) {
      return true;
    }
  }

  return false;
};


/**
 * Adds a new abuse record.
 */
export const recordAbuse = (req: types.AbuseRequest, abusePoints: number, expiryMillis?: number) => {

  const expiryTimeMillis = Date.now() +
    (expiryMillis || options.expiryMillis);

  if (options.byIP) {
    const ipAddress = trackingValues.getIP(req);
    db.run("INSERT INTO " + TABLENAME_IP + " " + TABLECOLUMNS_INSERT + " values (?, ?, ?)",
      ipAddress, expiryTimeMillis, abusePoints);
  }
};


/**
 * Middleware setup function
 */
export const abuseCheck = (options_user?: types.AbuseCheckOptions): express.RequestHandler => {

  initialize(options_user);

  setInterval(clearExpiredAbuse, options.clearIntervalMillis);

  const handler: express.RequestHandler = async(req, res, next) => {

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
