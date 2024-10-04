import assert from 'node:assert';
import { describe, it } from 'node:test';
import * as trackingValues from '../trackingValues.js';
const testIp = '192.168.0.1';
await describe('trackingValues', async () => {
    await describe('getIP()', async () => {
        await it('Finds the IP address in a request', () => {
            const fakeRequest = {
                ip: '127.0.0.1'
            };
            assert.strictEqual(trackingValues.getIP(fakeRequest), '127.0.0.1');
        });
    });
    await describe('getXForwardedFor()', async () => {
        await it('Returns a simple IP address in the X-Forwarded-For header', () => {
            const fakeRequest = {
                headers: {
                    'x-forwarded-for': testIp
                }
            };
            assert.strictEqual(trackingValues.getXForwardedFor(fakeRequest), testIp);
        });
        await it('Returns a simple IPv6 address in the X-Forwarded-For header', () => {
            const fakeRequest = {
                headers: {
                    'x-forwarded-for': '::1'
                }
            };
            assert.strictEqual(trackingValues.getXForwardedFor(fakeRequest), '::1');
        });
        await it('Returns the first IP address in the X-Forwarded-For header', () => {
            const fakeRequest = {
                headers: {
                    'x-forwarded-for': '192.168.0.1, 192.168.0.2, 192.168.0.3'
                }
            };
            assert.strictEqual(trackingValues.getXForwardedFor(fakeRequest), testIp);
        });
        await it('Returns the IP address less the port in the X-Forwarded-For header', () => {
            const fakeRequest = {
                headers: {
                    'x-forwarded-for': '192.168.0.1:5555'
                }
            };
            assert.strictEqual(trackingValues.getXForwardedFor(fakeRequest), testIp);
        });
        await it('Returns the IPv6 address less the brackets and port in the X-Forwarded-For header (IIS reverse proxy)', () => {
            const fakeRequest = {
                headers: {
                    'x-forwarded-for': '[::1]:5555'
                }
            };
            assert.strictEqual(trackingValues.getXForwardedFor(fakeRequest), '::1');
        });
        await it('Returns the whole value if unable to find an IP address in the X-Forwarded-For header', () => {
            const fakeRequest = {
                headers: {
                    'x-forwarded-for': 'abcdedf'
                }
            };
            assert.strictEqual(trackingValues.getXForwardedFor(fakeRequest), fakeRequest.headers['x-forwarded-for']);
        });
        await it('Returns a blank string if the X-Forwarded-For header is unset', () => {
            const fakeRequest = {};
            assert.strictEqual(trackingValues.getXForwardedFor(fakeRequest), '');
        });
    });
});
