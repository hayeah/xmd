///<reference path="./test.d.ts" />
declare var global: any;
import chai = require("chai");
global.assert = chai.assert;

export function assertJSONEqual(a,b) {
  assert.deepEqual(
    JSON.parse(JSON.stringify(a)),
    JSON.parse(JSON.stringify(b)));
}