///<reference path="./test.d.ts" />

import LineReader = require("./LineReader");
import chai = require("chai");

var assert = chai.assert;

describe("LineReader",function() {
  it("reads line in a document",function() {
      var reader = new LineReader("abc\n\n  \n  efg\n\n");

      var expects =
        [{ indent: 0, content: 'abc', lineno: 1 }
        ,{ indent: 0, content: 'abc', lineno: 1 }
        ,{ indent: 2, content: 'efg', lineno: 4 }
        ,{ indent: 2, content: 'efg', lineno: 4 }
        ,null
        ,null];

      var lines =
      [reader.peekNextLine()
      ,reader.readNextLine()

      ,reader.peekNextLine()
      ,reader.readNextLine()

      ,reader.peekNextLine()
      ,reader.readNextLine()
      ];

      assert.deepEqual(lines,expects);
      assert.ok(reader.isEOF);
  });
});

// describe("LineReader", function () {
//     it("foo", function () {
//         console.log("hello line reader!");
//     });
// });