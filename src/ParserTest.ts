///<reference path="./test.d.ts" />
import Parser = require("./Parser");
import chai = require("chai");
var assert = chai.assert;

describe("Parser",function() {

  function parseAssert(data,expectedResult,dump?) {
    var parser = new Parser(data);
    var doc = parser.parse();
    var result = JSON.parse(JSON.stringify(doc.children));
    if(dump) {
      console.log("parse:\n",data,"\nresult:\n",JSON.stringify(result,null,2),"\nexpect:\n", JSON.stringify(expectedResult, null, 2));
    }
    assert.deepEqual(result,expectedResult);
  }

  it("parse empty documents",function() {
    parseAssert("",[]);
    parseAssert("\n\n  \n  ",[]);
  });

  it("parses text blocks",function() {
      parseAssert("abc\ndef\nghi\n\nblock2",
                  [{"name":"p","children":["abc def ghi"]},{"name":"p","children":["block2"]}]);
  });

  describe("tag parsing",function() {
    it("parses tags with no content",function() {
      var doc;
      doc = "#foo";
      parseAssert(doc,[
        {
          "children": [],
          "name": "foo"
        }
      ]);
    });

    it("parses consecutive tags",function() {
      var doc;
      doc = "#foo\n#bar";
      parseAssert(doc,[
        {
          "children": [],
          "name": "foo"
        },
        {
          "children": [],
          "name": "bar"
        }
      ]);
    });

    it("parses tags recursively",function() {
      // var doc = `foobar`;
      var doc =
        "#foo\n" +
        "  text block 1\n" +
        "  of foo\n" +
        "  #foo2\n" +
        "    content of\n" +
        "    nested foo2\n"
        // "  text block 2 of foo\n"
        ;


      parseAssert(doc,[
        {
          "name": "foo",
          "children": [
            {
              "name": "p",
              "children": [
                "text block 1 of foo"
              ]
            },
            {
              "name": "foo2",
              "children": [
                {
                  "name": "p",
                  "children": [
                    "content of nested foo2"
                  ]
                }
              ]
            }
          ]
        }
      ]);
    });

    it("handles tag outdent",function() {
      var doc =
        "#foo\n" +
        "  content of foo\n" +
        "#bar\n" +
        "  content of bar\n" +
        "final line of content"
        ;

      parseAssert(doc,[
        {
          "name": "foo",
          "children": [
            {
              "name": "p",
              "children": [
                "content of foo"
              ]
            }
          ]
        },
        {
          "name": "bar",
          "children": [
            {
              "name": "p",
              "children": [
                "content of bar"
              ]
            }
          ]
        },
        {
          "name": "p",
          "children": [
            "final line of content"
          ]
        }
      ]);
    });
  });
});