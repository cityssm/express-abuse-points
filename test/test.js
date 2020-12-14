"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const abusePoints = require("../index");
describe("express-abuse-points", () => __awaiter(void 0, void 0, void 0, function* () {
    const fakeRequest = {
        "ip": "127.0.0.1"
    };
    before((done) => {
        abusePoints.initialize({
            "abusePointsMax": 10,
            "expiryMillis": 10000,
            "clearIntervalMillis": 5000
        });
        setTimeout(done, 1000);
    });
    it("Has access initially", () => __awaiter(void 0, void 0, void 0, function* () {
        const isAbuser = yield abusePoints.isAbuser(fakeRequest);
        assert.strictEqual(isAbuser, false);
    }));
    it("Still has access after one abuse record with less points than the max", () => __awaiter(void 0, void 0, void 0, function* () {
        abusePoints.recordAbuse(fakeRequest, 4);
        const isAbuser = yield abusePoints.isAbuser(fakeRequest);
        assert.strictEqual(isAbuser, false);
    }));
    it("Still has access after two abuse records with less points than the max", () => __awaiter(void 0, void 0, void 0, function* () {
        abusePoints.recordAbuse(fakeRequest, 4);
        const isAbuser = yield abusePoints.isAbuser(fakeRequest);
        assert.strictEqual(isAbuser, false);
    }));
    it("No longer has access after three abuse records summing more than the max", () => __awaiter(void 0, void 0, void 0, function* () {
        abusePoints.recordAbuse(fakeRequest, 4);
        const isAbuser = yield abusePoints.isAbuser(fakeRequest);
        assert.strictEqual(isAbuser, true);
    }));
    it("Regains access after clearing all records", () => __awaiter(void 0, void 0, void 0, function* () {
        abusePoints.clearAbuse(fakeRequest);
        const isAbuser = yield abusePoints.isAbuser(fakeRequest);
        assert.strictEqual(isAbuser, false);
    }));
    it("Records abuse record with using all defaults", () => {
        abusePoints.recordAbuse(fakeRequest);
        assert.ok("success");
    });
    it("Records abuse record with using no defaults", () => {
        abusePoints.recordAbuse(fakeRequest, 4, 1000);
        assert.ok("success");
    });
}));
