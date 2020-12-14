import * as assert from "assert";
import * as abusePoints from "../index";


describe("express-abuse-points", async() => {

  const fakeRequest = {
    "ip": "127.0.0.1"
  };

  before((done) => {
    abusePoints.initialize({
      "abusePointsMax": 10,
      "expiryMillis": 10000,
      "clearIntervalMillis": 5000
    });

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    setTimeout(done, 1000);
  });

  it("Has access initially", async() => {
    const isAbuser = await abusePoints.isAbuser(fakeRequest);
    assert.strictEqual(isAbuser, false);
  });

  it("Still has access after one abuse record with less points than the max", async() => {

    abusePoints.recordAbuse(fakeRequest, 4);

    const isAbuser = await abusePoints.isAbuser(fakeRequest);
    assert.strictEqual(isAbuser, false);
  });


  it("Still has access after two abuse records with less points than the max", async() => {

    abusePoints.recordAbuse(fakeRequest, 4);

    const isAbuser = await abusePoints.isAbuser(fakeRequest);
    assert.strictEqual(isAbuser, false);
  });


  it("No longer has access after three abuse records summing more than the max", async() => {

    abusePoints.recordAbuse(fakeRequest, 4);

    const isAbuser = await abusePoints.isAbuser(fakeRequest);
    assert.strictEqual(isAbuser, true);
  });


  it("Regains access after clearing all records", async() => {

    abusePoints.clearAbuse(fakeRequest);

    const isAbuser = await abusePoints.isAbuser(fakeRequest);
    assert.strictEqual(isAbuser, false);
  });


  it("Records abuse record with using all defaults", () => {

    abusePoints.recordAbuse(fakeRequest);

    assert.ok("success");
  });


  it("Records abuse record with using no defaults", () => {

    abusePoints.recordAbuse(fakeRequest, 4, 1000);

    assert.ok("success");
  });
});
