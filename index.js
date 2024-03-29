import sqlite3 from 'sqlite3';
import { getIP, getXForwardedFor } from './trackingValues.js';
const OPTIONS_DEFAULT = {
    byIP: true,
    byXForwardedFor: false,
    abusePoints: 1,
    expiryMillis: 5 * 60 * 1000,
    abusePointsMax: 10,
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
export function initialize(optionsUser) {
    options = Object.assign({}, OPTIONS_DEFAULT, optionsUser);
    if (database === undefined) {
        database = new sqlite3.Database(':memory:');
        if (options.byIP) {
            database.run(`CREATE TABLE IF NOT EXISTS ${TABLENAME_IP} ${TABLECOLUMNS_CREATE}`);
        }
        if (options.byXForwardedFor) {
            database.run(`CREATE TABLE IF NOT EXISTS ${TABLENAME_XFORWARDEDFOR} ${TABLECOLUMNS_CREATE}`);
        }
        clearAbuseIntervalFunction = setInterval(clearExpiredAbuse, options.clearIntervalMillis);
        const shutdownEvents = ['beforeExit', 'exit', 'SIGINT', 'SIGTERM'];
        for (const shutdownEvent of shutdownEvents) {
            process.on(shutdownEvent, shutdown);
        }
    }
    return abuseCheckHandler;
}
function clearExpiredAbuse() {
    if (options.byIP && database !== undefined) {
        database.run(`DELETE FROM ${TABLENAME_IP} WHERE expiryTimeMillis <= ?`, Date.now());
    }
    if (options.byXForwardedFor && database !== undefined) {
        database.run(`DELETE FROM ${TABLENAME_XFORWARDEDFOR} WHERE expiryTimeMillis <= ?`, Date.now());
    }
}
async function getAbusePoints(tableName, trackingValue) {
    return await new Promise((resolve, reject) => {
        database.get(`select sum(abusePoints) as abusePointsSum
        from ${tableName}
        where trackingValue = ?
        and expiryTimeMillis > ?`, trackingValue, Date.now(), (error, row) => {
            if (error !== null) {
                reject(error);
            }
            resolve(row?.abusePointsSum ?? 0);
        });
    });
}
function clearAbusePoints(tableName, trackingValue) {
    database.run(`DELETE FROM ${tableName} WHERE trackingValue = ?`, trackingValue);
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
export async function isAbuser(request) {
    if (options.byIP) {
        const ipAddress = getIP(request);
        if (ipAddress !== '') {
            const abusePoints = await getAbusePoints(TABLENAME_IP, ipAddress);
            if (abusePoints >= options.abusePointsMax) {
                return true;
            }
        }
    }
    if (options.byXForwardedFor) {
        const ipAddress = getXForwardedFor(request);
        if (ipAddress !== '') {
            const abusePoints = await getAbusePoints(TABLENAME_XFORWARDEDFOR, ipAddress);
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
            database.run(`INSERT INTO ${TABLENAME_IP} ${TABLECOLUMNS_INSERT} VALUES (?, ?, ?)`, ipAddress, expiryTimeMillis, abusePoints);
        }
    }
    if (options.byXForwardedFor) {
        const ipAddress = getXForwardedFor(request);
        if (ipAddress !== '') {
            database.run(`INSERT INTO ${TABLENAME_XFORWARDEDFOR} ${TABLECOLUMNS_INSERT} VALUES (?, ?, ?)`, ipAddress, expiryTimeMillis, abusePoints);
        }
    }
}
async function abuseCheckHandler(request, response, next) {
    const isRequestAbuser = await isAbuser(request);
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
