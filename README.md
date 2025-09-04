# express-abuse-points

[![npm](https://img.shields.io/npm/v/@cityssm/express-abuse-points)](https://www.npmjs.com/package/@cityssm/express-abuse-points)
[![DeepSource](https://app.deepsource.com/gh/cityssm/express-abuse-points.svg/?label=active+issues&show_trend=true&token=yB1nguIDLwV_FPUHv4zjmIF_)](https://app.deepsource.com/gh/cityssm/express-abuse-points/)
[![codecov](https://codecov.io/gh/cityssm/express-abuse-points/graph/badge.svg?token=TSFEM1DXCF)](https://codecov.io/gh/cityssm/express-abuse-points)
[![Coverage Testing](https://github.com/cityssm/express-abuse-points/actions/workflows/coverage.yml/badge.svg)](https://github.com/cityssm/express-abuse-points/actions/workflows/coverage.yml)

Express.js middleware for tracking and blocking abusive behaviour.

_Need to block a user repeatedly entering incorrect passwords into a login form?_

_Need to stop a user testing invalid product SKUs and coupon codes in an online store?_

_Need to discourage a user from testing out functions they don't have permission to use?_

**This middleware is for you!**

## Installation

```bash
npm install @cityssm/express-abuse-points
```

## Usage

It is recommended to include the middleware as early as possible in the middleware chain
to enforce the block as soon as possible.

### Initializing

```javascript
import { abuseCheck } from '@cityssm/express-abuse-points'

app.use(abuseCheck())
```

### Recording Abuse

```javascript
import { recordAbuse } from '@cityssm/express-abuse-points'

if (userDidSomethingBad) {
  recordAbuse(req, 3)
}
```

## API

### `abuseCheck([options: {}])`

The function to include in the Express application setup to initialize the middleware.
It accepts the following options.

| Property Name           | Description                                                                                     | Default Value           |
| ----------------------- | ----------------------------------------------------------------------------------------------- | ----------------------- |
| **byIP**                | Whether or not abuse points should be tracked by IP address.                                    | `true`                  |
| **byXForwardedFor**     | Whether or not abuse points should be tracked by the X-Forwarded-For header (proxy situations). | `false`                 |
| **abusePoints**         | The default number of points assigned to an abuse event.                                        | `1`                     |
| **expiryMillis**        | The default number of milliseconds an abuse record is enforced before expiring.                 | `300000` (five minutes) |
| **abusePointsMax**      | The total number of points a user can accumulate before being blocked.                          | `10`                    |
| **clearIntervalMillis** | The frequency the memory is cleared of expired abuse records.                                   | `3600000`               |

### `recordAbuse(req: Request, [abusePoints: number, [expiryMillis: number]])`

The function to include in the Express handlers to record abusive behaviours.

An optional `abusePoints` parameter is available if the record should have more or less weight than
the default `abusePoints`.

An optional `expiryMillis` parameter is available if the record should expiry sooner or later than
the default `expiryMillis`.

### `isAbuser(req: Request)`

Returns `true` if the given requestor has reached the abuse points threshold.

### `clearAbuse(req: Request)`

Clears all abuse records for the given requestor, expired or not.
Helpful if, for example, abuse was tracked for incorrect password attempts, but the user was finally successful.
