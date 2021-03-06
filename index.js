import * as trackingValues from "./trackingValues.js";
import sqlite3 from "sqlite3";
const OPTIONS_DEFAULT = {
    "byIP": true,
    "byXForwardedFor": false,
    "abusePoints": 1,
    "expiryMillis": 5 * 60 * 1000,
    "abusePointsMax": 10,
    "clearIntervalMillis": 60 * 60 * 1000
};
Object.freeze(OPTIONS_DEFAULT);
const TABLENAME_IP = "AbusePoints_IP";
const TABLENAME_XFORWARDEDFOR = "AbusePoints_XForwardedFor";
const TABLECOLUMNS_CREATE = "(trackingValue TEXT, expiryTimeMillis INT UNSIGNED, abusePoints TINYINT UNSIGNED)";
const TABLECOLUMNS_INSERT = "(trackingValue, expiryTimeMillis, abusePoints)";
let options = OPTIONS_DEFAULT;
let database;
let clearAbuseIntervalFunction;
export const shutdown = () => {
    try {
        clearInterval(clearAbuseIntervalFunction);
    }
    catch (_a) {
    }
    finally {
        clearAbuseIntervalFunction = undefined;
    }
    try {
        database.close();
    }
    catch (_b) {
    }
    finally {
        database = undefined;
    }
};
export const initialize = (options_user) => {
    options = Object.assign({}, OPTIONS_DEFAULT, options_user);
    if (!database) {
        database = new sqlite3.Database(":memory:");
        if (options.byIP) {
            database.run("CREATE TABLE IF NOT EXISTS " + TABLENAME_IP +
                " " + TABLECOLUMNS_CREATE);
        }
        if (options.byXForwardedFor) {
            database.run("CREATE TABLE IF NOT EXISTS " + TABLENAME_XFORWARDEDFOR +
                " " + TABLECOLUMNS_CREATE);
        }
        clearAbuseIntervalFunction = setInterval(clearExpiredAbuse, options.clearIntervalMillis);
        if (process) {
            const shutdownEvents = ["beforeExit", "exit", "SIGINT", "SIGTERM"];
            for (const shutdownEvent of shutdownEvents) {
                process.on(shutdownEvent, shutdown);
            }
        }
    }
};
const clearExpiredAbuse = () => {
    if (options.byIP) {
        database.run("DELETE FROM " + TABLENAME_IP +
            " WHERE expiryTimeMillis <= ?", Date.now());
    }
    if (options.byXForwardedFor) {
        database.run("DELETE FROM " + TABLENAME_XFORWARDEDFOR +
            " WHERE expiryTimeMillis <= ?", Date.now());
    }
};
const getAbusePoints = async (tableName, trackingValue) => {
    return await new Promise((resolve, reject) => {
        database.get("select sum(abusePoints) as abusePointsSum" +
            " from " + tableName +
            " where trackingValue = ?" +
            " and expiryTimeMillis > ?", trackingValue, Date.now(), (error, row) => {
            if (error) {
                reject(error);
            }
            if (row === null || row === void 0 ? void 0 : row.abusePointsSum) {
                resolve(row.abusePointsSum || 0);
            }
            resolve(0);
        });
    });
};
const clearAbusePoints = (tableName, trackingValue) => {
    database.run("delete from " + tableName +
        " where trackingValue = ?", trackingValue);
};
export const clearAbuse = (request) => {
    if (options.byIP) {
        const ipAddress = trackingValues.getIP(request);
        if (ipAddress !== "") {
            clearAbusePoints(TABLENAME_IP, ipAddress);
        }
    }
    if (options.byXForwardedFor) {
        const ipAddress = trackingValues.getXForwardedFor(request);
        if (ipAddress !== "") {
            clearAbusePoints(TABLENAME_XFORWARDEDFOR, ipAddress);
        }
    }
};
export const isAbuser = async (request) => {
    if (options.byIP) {
        const ipAddress = trackingValues.getIP(request);
        if (ipAddress !== "") {
            const abusePoints = await getAbusePoints(TABLENAME_IP, ipAddress);
            if (abusePoints >= options.abusePointsMax) {
                return true;
            }
        }
    }
    if (options.byXForwardedFor) {
        const ipAddress = trackingValues.getXForwardedFor(request);
        if (ipAddress !== "") {
            const abusePoints = await getAbusePoints(TABLENAME_XFORWARDEDFOR, ipAddress);
            if (abusePoints >= options.abusePointsMax) {
                return true;
            }
        }
    }
    return false;
};
export const recordAbuse = (request, abusePoints = options.abusePoints, expiryMillis = options.expiryMillis) => {
    const expiryTimeMillis = Date.now() + expiryMillis;
    if (options.byIP) {
        const ipAddress = trackingValues.getIP(request);
        if (ipAddress !== "") {
            database.run("INSERT INTO " + TABLENAME_IP + " " + TABLECOLUMNS_INSERT + " values (?, ?, ?)", ipAddress, expiryTimeMillis, abusePoints);
        }
    }
    if (options.byXForwardedFor) {
        const ipAddress = trackingValues.getXForwardedFor(request);
        if (ipAddress !== "") {
            database.run("INSERT INTO " + TABLENAME_XFORWARDEDFOR + " " + TABLECOLUMNS_INSERT + " values (?, ?, ?)", ipAddress, expiryTimeMillis, abusePoints);
        }
    }
};
const abuseCheckHandler = async (request, response, next) => {
    const isRequestAbuser = await isAbuser(request);
    if (isRequestAbuser) {
        response
            .status(403)
            .send("Access temporarily restricted.");
        response.end();
    }
    else {
        next();
    }
};
export const abuseCheck = (options_user) => {
    initialize(options_user);
    return abuseCheckHandler;
};
