import sqlite from 'better-sqlite3';
import exitHook from 'exit-hook';
import { getIP, getXForwardedFor } from './trackingValues.js';
const OPTIONS_DEFAULT = {
    byIP: true,
    byXForwardedFor: false,
    abusePoints: 1,
    abusePointsMax: 10,
    expiryMillis: 5 * 60 * 1000,
    clearIntervalMillis: 60 * 60 * 1000
};
Object.freeze(OPTIONS_DEFAULT);
const TABLENAME_IP = 'AbusePoints_IP';
const TABLENAME_XFORWARDEDFOR = 'AbusePoints_XForwardedFor';
const TABLECOLUMNS_CREATE = '(trackingValue TEXT, expiryTimeMillis INT UNSIGNED, abusePoints TINYINT UNSIGNED)';
const TABLECOLUMNS_INSERT = '(trackingValue, expiryTimeMillis, abusePoints)';
let options = OPTIONS_DEFAULT;
let database;
let clearAbuseIntervalFunction;
export function shutdown() {
    try {
        if (clearAbuseIntervalFunction !== undefined) {
            clearInterval(clearAbuseIntervalFunction);
        }
    }
    catch {
    }
    try {
        if (database !== undefined) {
            database.close();
        }
    }
    catch {
    }
}
function initializeDatabase() {
    if (database !== undefined) {
        return;
    }
    database = sqlite(':memory:');
    database
        .prepare(`CREATE TABLE IF NOT EXISTS ${TABLENAME_IP} ${TABLECOLUMNS_CREATE}`)
        .run();
    database
        .prepare(`CREATE TABLE IF NOT EXISTS ${TABLENAME_XFORWARDEDFOR} ${TABLECOLUMNS_CREATE}`)
        .run();
}
export function initialize(optionsUser) {
    options = { ...OPTIONS_DEFAULT, ...optionsUser };
    if (database === undefined) {
        initializeDatabase();
        clearAbuseIntervalFunction = setInterval(clearExpiredAbuse, options.clearIntervalMillis);
        exitHook(() => {
            shutdown();
        });
    }
    return abuseCheckHandler;
}
function clearExpiredAbuse() {
    if (options.byIP && database !== undefined) {
        database
            .prepare(`DELETE FROM ${TABLENAME_IP} WHERE expiryTimeMillis <= ?`)
            .run(Date.now());
    }
    if (options.byXForwardedFor && database !== undefined) {
        database
            .prepare(`DELETE FROM ${TABLENAME_XFORWARDEDFOR} WHERE expiryTimeMillis <= ?`)
            .run(Date.now());
    }
}
function getAbusePoints(tableName, trackingValue) {
    const row = database
        ?.prepare(`select sum(abusePoints) as abusePointsSum
      from ${tableName}
      where trackingValue = ?
      and expiryTimeMillis > ?`)
        .get(trackingValue, Date.now());
    return row?.abusePointsSum ?? 0;
}
function clearAbusePoints(tableName, trackingValue) {
    database
        ?.prepare(`DELETE FROM ${tableName} WHERE trackingValue = ?`)
        .run(trackingValue);
}
export function clearAbuse(request) {
    if (options.byIP) {
        const ipAddress = getIP(request);
        if (ipAddress !== '') {
            clearAbusePoints(TABLENAME_IP, ipAddress);
        }
    }
    if (options.byXForwardedFor) {
        const ipAddress = getXForwardedFor(request);
        if (ipAddress !== '') {
            clearAbusePoints(TABLENAME_XFORWARDEDFOR, ipAddress);
        }
    }
}
export function isAbuser(request) {
    if (options.byIP) {
        const ipAddress = getIP(request);
        if (ipAddress !== '') {
            const abusePoints = getAbusePoints(TABLENAME_IP, ipAddress);
            if (abusePoints >= options.abusePointsMax) {
                return true;
            }
        }
    }
    if (options.byXForwardedFor) {
        const ipAddress = getXForwardedFor(request);
        if (ipAddress !== '') {
            const abusePoints = getAbusePoints(TABLENAME_XFORWARDEDFOR, ipAddress);
            if (abusePoints >= options.abusePointsMax) {
                return true;
            }
        }
    }
    return false;
}
export function recordAbuse(request, abusePoints = options.abusePoints, expiryMillis = options.expiryMillis) {
    const expiryTimeMillis = Date.now() + expiryMillis;
    if (options.byIP) {
        const ipAddress = getIP(request);
        if (ipAddress !== '') {
            database
                ?.prepare(`INSERT INTO ${TABLENAME_IP} ${TABLECOLUMNS_INSERT} VALUES (?, ?, ?)`)
                .run(ipAddress, expiryTimeMillis, abusePoints);
        }
    }
    if (options.byXForwardedFor) {
        const ipAddress = getXForwardedFor(request);
        if (ipAddress !== '') {
            database
                ?.prepare(`INSERT INTO ${TABLENAME_XFORWARDEDFOR} ${TABLECOLUMNS_INSERT} VALUES (?, ?, ?)`)
                .run(ipAddress, expiryTimeMillis, abusePoints);
        }
    }
}
function abuseCheckHandler(request, response, next) {
    const isRequestAbuser = isAbuser(request);
    if (isRequestAbuser) {
        response.status(403).send('Access temporarily restricted.');
        response.end();
    }
    else {
        next();
    }
}
export function abuseCheck(optionsUser) {
    initialize(optionsUser);
    return abuseCheckHandler;
}
export default {
    initialize,
    shutdown,
    recordAbuse,
    isAbuser,
    clearAbuse,
    abuseCheck
};
