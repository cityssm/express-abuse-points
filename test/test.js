import assert from 'node:assert';
import * as abusePoints from '../index.js';
describe('express-abuse-points', () => {
    const fakeRequest = {
        ip: '127.0.0.1',
        headers: {
            'x-forwarded-for': '192.168.0.1, 192.168.0.2, 192.168.0.3'
        }
    };
    before((done) => {
        abusePoints.initialize({
            byIP: true,
            byXForwardedFor: true,
            abusePointsMax: 10,
            expiryMillis: 10000,
            clearIntervalMillis: 5000
        });
        setTimeout(done, 1000);
    });
    after(() => {
        abusePoints.shutdown();
    });
    it('Has access initially', async () => {
        const isAbuser = await abusePoints.isAbuser(fakeRequest);
        assert.strictEqual(isAbuser, false);
    });
    it('Still has access after one abuse record with less points than the max', async () => {
        abusePoints.recordAbuse(fakeRequest, 4);
        const isAbuser = await abusePoints.isAbuser(fakeRequest);
        assert.strictEqual(isAbuser, false);
    });
    it('Still has access after two abuse records with less points than the max', async () => {
        abusePoints.recordAbuse(fakeRequest, 4);
        const isAbuser = await abusePoints.isAbuser(fakeRequest);
        assert.strictEqual(isAbuser, false);
    });
    it('No longer has access after three abuse records summing more than the max', (done) => {
        abusePoints.recordAbuse(fakeRequest, 4);
        setTimeout(async () => {
            const isAbuser = await abusePoints.isAbuser(fakeRequest);
            assert.strictEqual(isAbuser, true);
            done();
        }, 500);
    });
    it('Regains access after clearing all records', (done) => {
        abusePoints.clearAbuse(fakeRequest);
        setTimeout(async () => {
            const isAbuser = await abusePoints.isAbuser(fakeRequest);
            assert.strictEqual(isAbuser, false);
            done();
        }, 500);
    });
    it('Records abuse record with using all defaults', () => {
        abusePoints.recordAbuse(fakeRequest);
        assert.ok('success');
    });
    it('Records abuse record with using no defaults', () => {
        abusePoints.recordAbuse(fakeRequest, 4, 1000);
        assert.ok('success');
    });
});
