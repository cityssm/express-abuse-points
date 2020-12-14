"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.abuseCheck = exports.recordAbuse = exports.isAbuser = exports.clearAbuse = exports.initialize = void 0;
const trackingValues = require("./trackingValues");
const sqlite3 = require("sqlite3");
const OPTIONS_DEFAULT = {
    "byIP": true,
    "expiryMillis": 5 * 60 * 1000,
    "abusePointsMax": 10,
    "clearIntervalMillis": 60 * 60 * 1000
};
Object.freeze(OPTIONS_DEFAULT);
const TABLENAME_IP = "AbusePoints_IP";
const TABLECOLUMNS_CREATE = "(trackingValue TEXT, expiryTimeMillis INT UNSIGNED, abusePoints TINYINT UNSIGNED)";
const TABLECOLUMNS_INSERT = "(trackingValue, expiryTimeMillis, abusePoints)";
let options = OPTIONS_DEFAULT;
let db;
const initialize = (options_user) => {
    options = Object.assign({}, OPTIONS_DEFAULT, options_user);
    if (!db) {
        db = new sqlite3.Database(":memory:");
        if (options.byIP) {
            db.run("CREATE TABLE IF NOT EXISTS " + TABLENAME_IP +
                " " + TABLECOLUMNS_CREATE);
        }
    }
};
exports.initialize = initialize;
const clearExpiredAbuse = () => {
    console.log("clear");
    if (options.byIP) {
        db.run("DELETE FROM " + TABLENAME_IP +
            " WHERE expiryTimeMillis <= ?", Date.now());
    }
};
const getAbusePoints = (tableName, trackingValue) => __awaiter(void 0, void 0, void 0, function* () {
    return yield new Promise((resolve, reject) => {
        db.get("select sum(abusePoints) as abusePointsSum" +
            " from " + tableName +
            " where trackingValue = ?" +
            " and expiryTimeMillis > ?", trackingValue, Date.now(), (err, row) => {
            if (err) {
                reject(err);
            }
            if (row === null || row === void 0 ? void 0 : row.abusePointsSum) {
                resolve(row.abusePointsSum || 0);
            }
            resolve(0);
        });
    });
});
const clearAbusePoints = (tableName, trackingValue) => {
    db.run("delete from " + tableName +
        " where trackingValue = ?", trackingValue);
};
const clearAbuse = (req) => {
    if (options.byIP) {
        const ipAddress = trackingValues.getIP(req);
        clearAbusePoints(TABLENAME_IP, ipAddress);
    }
};
exports.clearAbuse = clearAbuse;
const isAbuser = (req) => __awaiter(void 0, void 0, void 0, function* () {
    if (options.byIP) {
        const ipAddress = trackingValues.getIP(req);
        const abusePoints = yield getAbusePoints(TABLENAME_IP, ipAddress);
        if (abusePoints >= options.abusePointsMax) {
            return true;
        }
    }
    return false;
});
exports.isAbuser = isAbuser;
const recordAbuse = (req, abusePoints, expiryMillis) => {
    const expiryTimeMillis = Date.now() +
        (expiryMillis || options.expiryMillis);
    if (options.byIP) {
        const ipAddress = trackingValues.getIP(req);
        db.run("INSERT INTO " + TABLENAME_IP + " " + TABLECOLUMNS_INSERT + " values (?, ?, ?)", ipAddress, expiryTimeMillis, abusePoints);
    }
};
exports.recordAbuse = recordAbuse;
const abuseCheck = (options_user) => {
    exports.initialize(options_user);
    setInterval(clearExpiredAbuse, options.clearIntervalMillis);
    const handler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const isRequestAbuser = yield exports.isAbuser(req);
        if (isRequestAbuser) {
            res.status(403)
                .send("Access temporarily restricted.");
            res.end();
        }
        else {
            next();
        }
    });
    return handler;
};
exports.abuseCheck = abuseCheck;
