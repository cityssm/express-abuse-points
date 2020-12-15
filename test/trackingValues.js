"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const trackingValues = require("../trackingValues");
describe("trackingValues", () => {
    describe("getIP()", () => {
        it("Finds the IP address in a request", () => {
            const fakeRequest = {
                "ip": "127.0.0.1"
            };
            assert.strictEqual(trackingValues.getIP(fakeRequest), "127.0.0.1");
        });
    });
    describe("getXForwardedFor()", () => {
        it("Returns a simple IP address in the X-Forwarded-For header", () => {
            const fakeRequest = {
                "headers": {
                    "x-forwarded-for": "192.168.0.1"
                }
            };
            assert.strictEqual(trackingValues.getXForwardedFor(fakeRequest), "192.168.0.1");
        });
        it("Returns a simple IPv6 address in the X-Forwarded-For header", () => {
            const fakeRequest = {
                "headers": {
                    "x-forwarded-for": "::1"
                }
            };
            assert.strictEqual(trackingValues.getXForwardedFor(fakeRequest), "::1");
        });
        it("Returns the first IP address in the X-Forwarded-For header", () => {
            const fakeRequest = {
                "headers": {
                    "x-forwarded-for": "192.168.0.1, 192.168.0.2, 192.168.0.3"
                }
            };
            assert.strictEqual(trackingValues.getXForwardedFor(fakeRequest), "192.168.0.1");
        });
        it("Returns the IP address less the port in the X-Forwarded-For header", () => {
            const fakeRequest = {
                "headers": {
                    "x-forwarded-for": "192.168.0.1:5555"
                }
            };
            assert.strictEqual(trackingValues.getXForwardedFor(fakeRequest), "192.168.0.1");
        });
        it("Returns the IPv6 address less the brackets and port in the X-Forwarded-For header (IIS reverse proxy)", () => {
            const fakeRequest = {
                "headers": {
                    "x-forwarded-for": "[::1]:5555"
                }
            };
            assert.strictEqual(trackingValues.getXForwardedFor(fakeRequest), "::1");
        });
        it("Returns the whole value if unable to find an IP address in the X-Forwarded-For header", () => {
            const fakeRequest = {
                "headers": {
                    "x-forwarded-for": "abcdedf"
                }
            };
            assert.strictEqual(trackingValues.getXForwardedFor(fakeRequest), fakeRequest.headers["x-forwarded-for"]);
        });
        it("Returns a blank string if the X-Forwarded-For header is unset", () => {
            const fakeRequest = {};
            assert.strictEqual(trackingValues.getXForwardedFor(fakeRequest), "");
        });
    });
});
