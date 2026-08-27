import { minutesToMillis } from '@cityssm/to-millis';
import sqlite from 'better-sqlite3';
import exitHook from 'exit-hook';
import { getIP, getXForwardedFor } from './trackingValues.js';
const OPTIONS_DEFAULT = {
    byIP: true,
    byXForwardedFor: false,
    abuseMessageText: 'Access temporarily restricted.',
    abusePoints: 1,
    abusePointsMax: 10,
    clearIntervalMillis: minutesToMillis(60),
    expiryMillis: minutesToMillis(5)
};
Object.freeze(OPTIONS_DEFAULT);
const tableNameIP = 'AbusePoints_IP';
const tableNameXForwardedFor = 'AbusePoints_XForwardedFor';
const tableColumnsCreate = 
/* sql */ '(trackingValue TEXT, expiryTimeMillis INT UNSIGNED, abusePoints TINYINT UNSIGNED)';
const tableColumnsInsert = '(trackingValue, expiryTimeMillis, abusePoints)';
let options = OPTIONS_DEFAULT;
let database;
let clearAbuseIntervalFunction;
/**
 * Cleans up handler.
 */
export function shutdown() {
    try {
        if (clearAbuseIntervalFunction !== undefined) {
            clearInterval(clearAbuseIntervalFunction);
        }
    }
    catch {
        // ignore
    }
    try {
        if (database !== undefined) {
            database.close();
        }
    }
    catch {
        // ignore
    }
}
function initializeDatabase() {
    if (database !== undefined) {
        return;
    }
    database = sqlite(':memory:');
    database
        .prepare(`CREATE TABLE IF NOT EXISTS ${tableNameIP} ${tableColumnsCreate}`)
        .run();
    database
        .prepare(`CREATE TABLE IF NOT EXISTS ${tableNameXForwardedFor} ${tableColumnsCreate}`)
        .run();
}
/**
 * Initializes the middleware.
 * @param optionsUser - The options.
 * @returns The Express middleware.
 */
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
            // eslint-disable-next-line sqlite-security/no-unsafe-query
            .prepare(/* sql */ `
        DELETE FROM ${tableNameIP}
        WHERE
          expiryTimeMillis <= ?
      `)
            .run(Date.now());
    }
    if (options.byXForwardedFor && database !== undefined) {
        database
            // eslint-disable-next-line sqlite-security/no-unsafe-query
            .prepare(/* sql */ `
        DELETE FROM ${tableNameXForwardedFor}
        WHERE
          expiryTimeMillis <= ?
      `)
            .run(Date.now());
    }
}
function getAbusePoints(tableName, trackingValue) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const points = database
        // eslint-disable-next-line sqlite-security/no-unsafe-query
        ?.prepare(/* sql */ `
      SELECT
        SUM(abusePoints) AS abusePointsSum
      FROM
        ${tableName}
      WHERE
        trackingValue = ?
        AND expiryTimeMillis > ?
    `)
        .pluck()
        .get(trackingValue, Date.now());
    return points ?? 0;
}
function clearAbusePoints(tableName, trackingValue) {
    database
        // eslint-disable-next-line sqlite-security/no-unsafe-query
        ?.prepare(/* sql */ `
      DELETE FROM ${tableName}
      WHERE
        trackingValue = ?
    `)
        .run(trackingValue);
}
/**
 * Clears all abuse records from a requestor, expired or not.
 * @param request - The Express request.
 */
export function clearAbuse(request) {
    if (options.byIP) {
        const ipAddress = getIP(request);
        if (ipAddress !== '') {
            clearAbusePoints(tableNameIP, ipAddress);
        }
    }
    if (options.byXForwardedFor) {
        const ipAddress = getXForwardedFor(request);
        if (ipAddress !== '') {
            clearAbusePoints(tableNameXForwardedFor, ipAddress);
        }
    }
}
/**
 * Checks if the current requestor is considered from an abusive source.
 * @param request - The Express request.
 * @returns `true` if the requestor is considered an abusive source.
 */
export function isAbuser(request) {
    if (options.byIP) {
        const ipAddress = getIP(request);
        if (ipAddress !== '') {
            const abusePoints = getAbusePoints(tableNameIP, ipAddress);
            if (abusePoints >= options.abusePointsMax) {
                return true;
            }
        }
    }
    if (options.byXForwardedFor) {
        const ipAddress = getXForwardedFor(request);
        if (ipAddress !== '') {
            const abusePoints = getAbusePoints(tableNameXForwardedFor, ipAddress);
            if (abusePoints >= options.abusePointsMax) {
                return true;
            }
        }
    }
    return false;
}
/**
 * Adds a new abuse record.
 * @param request - The Express request.
 * @param abusePoints - The number of abuse points to apply.
 * @param expiryMillis - The length of time in milliseconds until the abuse points expire.
 */
export function recordAbuse(request, abusePoints = options.abusePoints, expiryMillis = options.expiryMillis) {
    const expiryTimeMillis = Date.now() + expiryMillis;
    if (options.byIP) {
        const ipAddress = getIP(request);
        if (ipAddress !== '') {
            database
                // eslint-disable-next-line sqlite-security/no-unsafe-query
                ?.prepare(/* sql */ `
          INSERT INTO
            ${tableNameIP} ${tableColumnsInsert}
          VALUES
            (?, ?, ?)
        `)
                .run(ipAddress, expiryTimeMillis, abusePoints);
        }
    }
    if (options.byXForwardedFor) {
        const ipAddress = getXForwardedFor(request);
        if (ipAddress !== '') {
            database
                // eslint-disable-next-line sqlite-security/no-unsafe-query
                ?.prepare(/* sql */ `
          INSERT INTO
            ${tableNameXForwardedFor} ${tableColumnsInsert}
          VALUES
            (?, ?, ?)
        `)
                .run(ipAddress, expiryTimeMillis, abusePoints);
        }
    }
}
/**
 * Middleware handler function
 * @param request - The Express request.
 * @param response - The Express response.
 * @param next - The Express next function.
 */
function abuseCheckHandler(request, response, next) {
    const isRequestAbuser = isAbuser(request);
    if (isRequestAbuser) {
        response.status(403).send(options.abuseMessageText);
        response.end();
    }
    else {
        next();
    }
}
/**
 * Middleware setup function.
 * @param optionsUser - The options.
 * @returns - The middleware handler function.
 */
export function abuseCheck(optionsUser) {
    initialize(optionsUser);
    return abuseCheckHandler;
}
export default {
    abuseCheck,
    clearAbuse,
    initialize,
    isAbuser,
    recordAbuse,
    shutdown
};
