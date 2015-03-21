///<reference path="./test.d.ts" />

import TextParser = require("./TextParser");

function assertParse(a,b) {
  assert.deepEqual(JSON.parse(JSON.stringify(a)),b);
}

describe("TextParser",() => {
  describe("#readString",() => {
    function readString(src: string): string {
      var p = new TextParser(src);
      return p.readString();
    }

    it("reads all the way to the end",() => {
      assert.equal(readString(""),"");
      assert.equal(readString(" ")," ");
      assert.equal(readString(" abcdefg abcdefg ")," abcdefg abcdefg ");
    });

    it("reads up to reserved chars",() => {
      assert.equal(readString("abcdefg*   "),"abcdefg");
      assert.equal(readString("abcdefg_   "),"abcdefg");
      assert.equal(readString("abcdefg`   "),"abcdefg");
      assert.equal(readString("abcdefg[   "),"abcdefg");
    });

    it("escapes any char as itself",() => {
      assert.equal(readString("\\*"),"*");
      assert.equal(readString("\\a"),"a");
      assert.equal(readString("\\1"),"1");
    });

    it("advances parser's position",() => {
      var p = new TextParser("content*more stuff*");
      p.readString();
      assert.equal(p.residue(),"*more stuff*");
    });

    it("is an error if backslash is followed by EOF",() => {
      assert.throw(() => {
        readString("foo\\");
      });
    });
  });

  describe("#parseDelimitedTag", () => {
    function parseDelimitedTag(src: string,expected?): string {
      var parser = new TextParser(src);
      var result = parser.parseDelimitedTag();
      // console.log(JSON.stringify(result,null,2));
      if(expected != null) {
        assertParse(result,expected);
      }
      return parser.residue();
    }

    it("throws error if delimited content is empty",() => {
      assert.throw(() => {
        parseDelimitedTag("**");
      });
    });

    it("parses literals denoted by reserved chars",() => {
      parseDelimitedTag("*content*",{
        "name": "*",
        "children": [
          "content"
        ]
      });

      parseDelimitedTag("_content_",{
        "name": "_",
        "children": [
          "content"
        ]
      });
    });

    it("treats `` and ` two different delimiters",() => {
      parseDelimitedTag("`content`",{
        "name": "`",
        "children": [
          "content"
        ]
      });

      parseDelimitedTag("``content``",{
        "name": "``",
        "children": [
          "content"
        ]
      });
    });

    it("ignores nestings",() => {
      parseDelimitedTag("_*content*_",{
        "name": "_",
        "children": [
          "*content*"
        ]
      });
    });
  });

  describe("#parseInlineTag",() => {
    function parseInlineTag(src,expected?): string {
      var parser = new TextParser(src);
      var result = parser.parseInlineTag();
      // console.log(JSON.stringify(result,null,2));
      if(expected != null) {
        assertParse(result,expected);
      }
      return parser.residue();
    }

    it("throws error if tag name is empty",() => {
      assert.throw(() => {
        parseInlineTag("[][hello]");
      });
    });

    it("parses inline tag that has no content",() => {
      parseInlineTag("[foo]",{
        "name": "foo",
        "children": []
      });

      parseInlineTag("[foo][]",{
        "name": "foo",
        "children": []
      });
    });

    it("parses inline tag that has content",() => {
      parseInlineTag("[foo][ ]",{
        "name": "foo",
        "children": [" "]
      });

      parseInlineTag("[foo][content of foo]",{
        "name": "foo",
        "children": [
          "content of foo"
        ]
      });
    });

    it("parses arguments",() => {
      parseInlineTag("[foo a b=b c][content of foo]",{
        "name": "foo",
        "args": [
          "a",
          "c"
        ],
        "opts": {
          "b": "b"
        },
        "children": [
          "content of foo"
        ]
      });
    });

    it("parses nesting tags recursively",() => {
      var tag =
`
[foo][
leading *foo* content
[bar][content of bar with [qux]]
trailing foo]
`.trim();

      parseInlineTag(tag,{
        "name": "foo",
        "children": [
          "\nleading ",
          {
            "name": "*",
            "children": [
              "foo"
            ]
          },
          " content\n",
          {
            "name": "bar",
            "children": [
              "content of bar with ",
              {
                "name": "qux",
                "children": []
              }
            ]
          },
          "\ntrailing foo"
        ]
      });
    });
  });

  describe("#parse",() => {
    function parse(src:string,expected?:any,show?:boolean): string {
      var parser = new TextParser(src);
      var result = parser.parse();
      if(show) {
        console.log(JSON.stringify(result,null,2))
      }

      if(expected != null) {
        assertParse(result,expected);
      }

      return parser.residue();
    }

    it("throws error is inline tag nesting is imbalanced",() => {
      assert.throw(() => {
        parse("[foo]]")
      });

      assert.throw(() => {
        parse("[foo][hello [] lala")
      });
    })

    it("returns array of nodes",() => {
      parse("text*bold*text",
        [
          "text",
          {
            "name": "*",
            "children": [
              "bold"
            ]
          },
          "text"
        ]
      );
    });


  });

});