# express-abuse-points

Express.js middleware for tracking and blocking abusive behaviour.



## Installation

```bash
npm install @cityssm/express-abuse-points
```

## Usage

It is recommended to include the middleware as early as possible in the middleware chain
to enforce the block as soon as possible.

### Initializing

```javascript
import { abuseCheck } from "@cityssm/express-abuse-points";

app.use(abuseCheck());
```

### Recording Abuse

```javascript
import { recordAbuse } from "@cityssm/express-abuse-points";

if (userDidSomethingBad) {
  recordAbuse(req, 3);
}
```

## API

### `abuseCheck([options: {}]);`

The function to include in the Express application setup to initialize the middleware.
It accepts the following options.

| Property Name           | Description                                                                     | Default Value           |
| ----------------------- | ------------------------------------------------------------------------------- | ----------------------- |
| **byIP**                | Whether or not abuse points should be tracked by IP address.                    | `true`                  |
| **expiryMillis**        | The default number of milliseconds an abuse record is enforced before expiring. | `300000` (five minutes) |
| **abusePointsMax**      | The total number of points a user can accumulate before being blocked.          | `10`                    |
| **clearIntervalMillis** | The frequency the memory is cleared of expired abuse records.                   | `3600000`               |

### `recordAbuse(req: Request, abusePoints: number, [expiryMillis: number]);`

The function to include in the Express handlers to record abusive behaviours.
An optional `expiryMillis` parameter is available if the record should expiry sooner or later than the default `expiryMillis`.
