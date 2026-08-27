import { minutesToMillis } from '@cityssm/to-millis'
import sqlite from 'better-sqlite3'
import exitHook from 'exit-hook'
import type express from 'express'

import { getIP, getXForwardedFor } from './trackingValues.js'
import type { AbuseCheckOptions } from './types.js'

const OPTIONS_DEFAULT: AbuseCheckOptions = {
  byIP: true,
  byXForwardedFor: false,

  abuseMessageText: 'Access temporarily restricted.',

  abusePoints: 1,
  abusePointsMax: 10,

  clearIntervalMillis: minutesToMillis(60),
  expiryMillis: minutesToMillis(5)
}

Object.freeze(OPTIONS_DEFAULT)

type TableName = 'AbusePoints_IP' | 'AbusePoints_XForwardedFor'

const tableNameIP = 'AbusePoints_IP'
const tableNameXForwardedFor = 'AbusePoints_XForwardedFor'

const tableColumnsCreate =
  /* sql */ '(trackingValue TEXT, expiryTimeMillis INT UNSIGNED, abusePoints TINYINT UNSIGNED)'

const tableColumnsInsert = '(trackingValue, expiryTimeMillis, abusePoints)'

let options: AbuseCheckOptions = OPTIONS_DEFAULT

let database: sqlite.Database | undefined

let clearAbuseIntervalFunction: NodeJS.Timeout | undefined

/**
 * Cleans up handler.
 */
export function shutdown(): void {
  try {
    if (clearAbuseIntervalFunction !== undefined) {
      clearInterval(clearAbuseIntervalFunction)
    }
  } catch {
    // ignore
  }

  try {
    if (database !== undefined) {
      database.close()
    }
  } catch {
    // ignore
  }
}

function initializeDatabase(): void {
  if (database !== undefined) {
    return
  }

  database = sqlite(':memory:')

  database
    .prepare(`CREATE TABLE IF NOT EXISTS ${tableNameIP} ${tableColumnsCreate}`)
    .run()

  database
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${tableNameXForwardedFor} ${tableColumnsCreate}`
    )
    .run()
}

/**
 * Initializes the middleware.
 * @param optionsUser - The options.
 * @returns The Express middleware.
 */
export function initialize(
  optionsUser?: Partial<AbuseCheckOptions>
): express.RequestHandler {
  options = { ...OPTIONS_DEFAULT, ...optionsUser }

  if (database === undefined) {
    initializeDatabase()

    clearAbuseIntervalFunction = setInterval(
      clearExpiredAbuse,
      options.clearIntervalMillis
    )

    exitHook(() => {
      shutdown()
    })
  }

  return abuseCheckHandler as express.RequestHandler
}

function clearExpiredAbuse(): void {
  if (options.byIP && database !== undefined) {
    database
      // eslint-disable-next-line sqlite-security/no-unsafe-query
      .prepare(/* sql */ `
        DELETE FROM ${tableNameIP}
        WHERE
          expiryTimeMillis <= ?
      `)
      .run(Date.now())
  }

  if (options.byXForwardedFor && database !== undefined) {
    database
      // eslint-disable-next-line sqlite-security/no-unsafe-query
      .prepare(/* sql */ `
        DELETE FROM ${tableNameXForwardedFor}
        WHERE
          expiryTimeMillis <= ?
      `)
      .run(Date.now())
  }
}

function getAbusePoints(tableName: TableName, trackingValue: string): number {
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
    .get(trackingValue, Date.now()) as number | undefined

  return points ?? 0
}

function clearAbusePoints(tableName: TableName, trackingValue: string): void {
  database
    // eslint-disable-next-line sqlite-security/no-unsafe-query
    ?.prepare(/* sql */ `
      DELETE FROM ${tableName}
      WHERE
        trackingValue = ?
    `)
    .run(trackingValue)
}

/**
 * Clears all abuse records from a requestor, expired or not.
 * @param request - The Express request.
 */
export function clearAbuse(request: Partial<express.Request>): void {
  if (options.byIP) {
    const ipAddress = getIP(request)

    if (ipAddress !== '') {
      clearAbusePoints(tableNameIP, ipAddress)
    }
  }

  if (options.byXForwardedFor) {
    const ipAddress = getXForwardedFor(request)

    if (ipAddress !== '') {
      clearAbusePoints(tableNameXForwardedFor, ipAddress)
    }
  }
}

/**
 * Checks if the current requestor is considered from an abusive source.
 * @param request - The Express request.
 * @returns `true` if the requestor is considered an abusive source.
 */
export function isAbuser(request: Partial<express.Request>): boolean {
  if (options.byIP) {
    const ipAddress = getIP(request)

    if (ipAddress !== '') {
      const abusePoints = getAbusePoints(tableNameIP, ipAddress)

      if (abusePoints >= options.abusePointsMax) {
        return true
      }
    }
  }

  if (options.byXForwardedFor) {
    const ipAddress = getXForwardedFor(request)

    if (ipAddress !== '') {
      const abusePoints = getAbusePoints(tableNameXForwardedFor, ipAddress)

      if (abusePoints >= options.abusePointsMax) {
        return true
      }
    }
  }

  return false
}

/**
 * Adds a new abuse record.
 * @param request - The Express request.
 * @param abusePoints - The number of abuse points to apply.
 * @param expiryMillis - The length of time in milliseconds until the abuse points expire.
 */
export function recordAbuse(
  request: Partial<express.Request>,
  abusePoints: number = options.abusePoints,
  expiryMillis: number = options.expiryMillis
): void {
  const expiryTimeMillis = Date.now() + expiryMillis

  if (options.byIP) {
    const ipAddress = getIP(request)

    if (ipAddress !== '') {
      database
        // eslint-disable-next-line sqlite-security/no-unsafe-query
        ?.prepare(/* sql */ `
          INSERT INTO
            ${tableNameIP} ${tableColumnsInsert}
          VALUES
            (?, ?, ?)
        `)
        .run(ipAddress, expiryTimeMillis, abusePoints)
    }
  }

  if (options.byXForwardedFor) {
    const ipAddress = getXForwardedFor(request)

    if (ipAddress !== '') {
      database
        ?.prepare(/* sql */ `
          INSERT INTO
            ${tableNameXForwardedFor} ${tableColumnsInsert}
          VALUES
            (?, ?, ?)
        `)
        .run(ipAddress, expiryTimeMillis, abusePoints)
    }
  }
}

/**
 * Middleware handler function
 * @param request - The Express request.
 * @param response - The Express response.
 * @param next - The Express next function.
 */
function abuseCheckHandler(
  request: express.Request,
  response: express.Response,
  next: express.NextFunction
): void {
  const isRequestAbuser = isAbuser(request)

  if (isRequestAbuser) {
    response.status(403).send(options.abuseMessageText)

    response.end()
  } else {
    next()
  }
}

/**
 * Middleware setup function.
 * @param optionsUser - The options.
 * @returns - The middleware handler function.
 */
export function abuseCheck(
  optionsUser?: Partial<AbuseCheckOptions>
): express.RequestHandler {
  initialize(optionsUser)
  return abuseCheckHandler as express.RequestHandler
}

export default {
  abuseCheck,
  clearAbuse,
  initialize,
  isAbuser,
  recordAbuse,
  shutdown
}
