import type express from 'express'
import sqlite3 from 'sqlite3'

import * as trackingValues from './trackingValues.js'
import type * as types from './types'

const OPTIONS_DEFAULT: types.AbuseCheckOptions = {
  byIP: true,
  byXForwardedFor: false,

  abusePoints: 1,
  expiryMillis: 5 * 60 * 1000, // 5 minutes

  abusePointsMax: 10,
  clearIntervalMillis: 60 * 60 * 1000 // 1 hour
}

Object.freeze(OPTIONS_DEFAULT)

type TABLENAME = 'AbusePoints_IP' | 'AbusePoints_XForwardedFor'
const TABLENAME_IP = 'AbusePoints_IP'
const TABLENAME_XFORWARDEDFOR = 'AbusePoints_XForwardedFor'

const TABLECOLUMNS_CREATE =
  '(trackingValue TEXT, expiryTimeMillis INT UNSIGNED, abusePoints TINYINT UNSIGNED)'
const TABLECOLUMNS_INSERT = '(trackingValue, expiryTimeMillis, abusePoints)'

let options: types.AbuseCheckOptions = OPTIONS_DEFAULT
let database: sqlite3.Database

let clearAbuseIntervalFunction: NodeJS.Timeout

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

export function initialize(
  optionsUser?: Partial<types.AbuseCheckOptions>
): express.RequestHandler {
  options = Object.assign({}, OPTIONS_DEFAULT, optionsUser)

  if (database === undefined) {
    database = new sqlite3.Database(':memory:')

    if (options.byIP) {
      database.run(
        'CREATE TABLE IF NOT EXISTS ' + TABLENAME_IP + ' ' + TABLECOLUMNS_CREATE
      )
    }

    if (options.byXForwardedFor) {
      database.run(
        'CREATE TABLE IF NOT EXISTS ' +
          TABLENAME_XFORWARDEDFOR +
          ' ' +
          TABLECOLUMNS_CREATE
      )
    }

    clearAbuseIntervalFunction = setInterval(
      clearExpiredAbuse,
      options.clearIntervalMillis
    )

    const shutdownEvents = ['beforeExit', 'exit', 'SIGINT', 'SIGTERM']

    for (const shutdownEvent of shutdownEvents) {
      process.on(shutdownEvent, shutdown)
    }
  }

  return abuseCheckHandler as express.RequestHandler
}

function clearExpiredAbuse(): void {
  if (options.byIP && database !== undefined) {
    database.run(
      'DELETE FROM ' + TABLENAME_IP + ' WHERE expiryTimeMillis <= ?',
      Date.now()
    )
  }

  if (options.byXForwardedFor && database !== undefined) {
    database.run(
      'DELETE FROM ' + TABLENAME_XFORWARDEDFOR + ' WHERE expiryTimeMillis <= ?',
      Date.now()
    )
  }
}

async function getAbusePoints(
  tableName: TABLENAME,
  trackingValue: string
): Promise<number> {
  return await new Promise((resolve, reject) => {
    database.get(
      `select sum(abusePoints) as abusePointsSum
        from ${tableName}
        where trackingValue = ?
        and expiryTimeMillis > ?`,
      trackingValue,
      Date.now(),
      (error: unknown, row: { abusePointsSum?: number }) => {
        if (error !== null) {
          reject(error)
        }

        resolve(row?.abusePointsSum ?? 0)
      }
    )
  })
}

function clearAbusePoints(tableName: TABLENAME, trackingValue: string): void {
  database.run(
    'delete from ' + tableName + ' where trackingValue = ?',
    trackingValue
  )
}

/**
 * Clears all abuse records from a requestor, expired or not.
 */
export function clearAbuse(request: Partial<express.Request>): void {
  if (options.byIP) {
    const ipAddress = trackingValues.getIP(request)

    if (ipAddress !== '') {
      clearAbusePoints(TABLENAME_IP, ipAddress)
    }
  }

  if (options.byXForwardedFor) {
    const ipAddress = trackingValues.getXForwardedFor(request)

    if (ipAddress !== '') {
      clearAbusePoints(TABLENAME_XFORWARDEDFOR, ipAddress)
    }
  }
}

/**
 * Checks if the current requestor is considered from an abusive source.
 */
export async function isAbuser(
  request: Partial<express.Request>
): Promise<boolean> {
  if (options.byIP) {
    const ipAddress = trackingValues.getIP(request)

    if (ipAddress !== '') {
      const abusePoints = await getAbusePoints(TABLENAME_IP, ipAddress)

      if (abusePoints >= options.abusePointsMax) {
        return true
      }
    }
  }

  if (options.byXForwardedFor) {
    const ipAddress = trackingValues.getXForwardedFor(request)

    if (ipAddress !== '') {
      const abusePoints = await getAbusePoints(
        TABLENAME_XFORWARDEDFOR,
        ipAddress
      )

      if (abusePoints >= options.abusePointsMax) {
        return true
      }
    }
  }

  return false
}

/**
 * Adds a new abuse record.
 */
export function recordAbuse(
  request: Partial<express.Request>,
  abusePoints: number = options.abusePoints,
  expiryMillis: number = options.expiryMillis
): void {
  const expiryTimeMillis = Date.now() + expiryMillis

  if (options.byIP) {
    const ipAddress = trackingValues.getIP(request)

    if (ipAddress !== '') {
      database.run(
        'INSERT INTO ' +
          TABLENAME_IP +
          ' ' +
          TABLECOLUMNS_INSERT +
          ' values (?, ?, ?)',
        ipAddress,
        expiryTimeMillis,
        abusePoints
      )
    }
  }

  if (options.byXForwardedFor) {
    const ipAddress = trackingValues.getXForwardedFor(request)

    if (ipAddress !== '') {
      database.run(
        'INSERT INTO ' +
          TABLENAME_XFORWARDEDFOR +
          ' ' +
          TABLECOLUMNS_INSERT +
          ' values (?, ?, ?)',
        ipAddress,
        expiryTimeMillis,
        abusePoints
      )
    }
  }
}

/**
 * Middleware setup function
 */

async function abuseCheckHandler(
  request: express.Request,
  response: express.Response,
  next: express.NextFunction
): Promise<void> {
  const isRequestAbuser = await isAbuser(request)

  if (isRequestAbuser) {
    response.status(403).send('Access temporarily restricted.')

    response.end()
  } else {
    next()
  }
}

export function abuseCheck(
  optionsUser?: types.AbuseCheckOptions
): express.RequestHandler {
  initialize(optionsUser)
  return abuseCheckHandler as express.RequestHandler
}
