// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-magic-numbers */

import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'

import * as abusePoints from '../index.js'

await describe('express-abuse-points', async () => {
  const fakeRequest = {
    ip: '127.0.0.1',

    headers: {
      'x-forwarded-for': '192.168.0.1, 192.168.0.2, 192.168.0.3'
    }
  }

  before(() => {
    abusePoints.initialize({
      byIP: true,
      byXForwardedFor: true,
      abusePointsMax: 10,
      expiryMillis: 10_000,
      clearIntervalMillis: 5000
    })
  })

  after(() => {
    abusePoints.shutdown()
  })

  await it('Has access initially', () => {
    const isAbuser = abusePoints.isAbuser(fakeRequest)
    assert.strictEqual(isAbuser, false)
  })

  await it('Still has access after one abuse record with less points than the max', () => {
    abusePoints.recordAbuse(fakeRequest, 4)

    const isAbuser = abusePoints.isAbuser(fakeRequest)
    assert.strictEqual(isAbuser, false)
  })

  await it('Still has access after two abuse records with less points than the max', () => {
    abusePoints.recordAbuse(fakeRequest, 4)

    const isAbuser = abusePoints.isAbuser(fakeRequest)
    assert.strictEqual(isAbuser, false)
  })

  await it('No longer has access after three abuse records summing more than the max', () => {
    abusePoints.recordAbuse(fakeRequest, 4)

    const isAbuser = abusePoints.isAbuser(fakeRequest)
    assert.strictEqual(isAbuser, true)
  })

  await it('Regains access after clearing all records', () => {
    abusePoints.clearAbuse(fakeRequest)

    const isAbuser = abusePoints.isAbuser(fakeRequest)
    assert.strictEqual(isAbuser, false)
  })

  await it('Records abuse record with using all defaults', () => {
    abusePoints.recordAbuse(fakeRequest)

    assert.ok(true)
  })

  await it('Records abuse record with using no defaults', () => {
    abusePoints.recordAbuse(fakeRequest, 4, 1000)

    assert.ok(true)
  })
})
