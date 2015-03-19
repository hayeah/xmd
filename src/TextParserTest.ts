///<reference path="./test.d.ts" />

import TextParser = require("./TextParser");

describe("TextParser",() => {
  describe("#readDelimited", () => {
    function readDelimited(src: string, delimiter: string): string {
      var p = new TextParser(src);
      return p.readDelimited(delimiter);
    }

    it("returns the content string between delimiters", () => {
      assert.equal(readDelimited("*content*","*"),"content");
      assert.equal(readDelimited("**","*"),"");
      assert.equal(readDelimited("**content**","**"),"content");
    });

    it("returns null if end delimiter cannot be found", () => {
      assert.isNull(readDelimited("*content","*"));
    });

    it("advances parser's position", () => {
      var p = new TextParser("*content*more stuff");
      p.readDelimited("*");
      assert.equal(p.residue(),"more stuff");
    });
  });

  describe("#readString",() => {
    function readString(src: string): string {
      var p = new TextParser(src);
      return p.readString();
    }

    it("reads all the way to the end",() => {
      assert.equal(readString(""),"");
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

  describe("#parse",() => {
    function parse(src:string) {
      var p = new TextParser(src);
      var r = p.parse();
      return r;
    }

    function test(src:string,expected:any,show?:boolean) {
      var nodes = parse(src);
      var result = JSON.parse(JSON.stringify(nodes))
      if(show) {
        console.log(JSON.stringify(nodes,null,2))
      }
      assert.deepEqual(result,expected);
    }

    it("returns array of nodes",() => {
      test("text*bold*_itatlic_`code`text",
        [
          "text",
          {
            "name": "*",
            "children": [
              "bold"
            ]
          },
          {
            "name": "_",
            "children": [
              "itatlic"
            ]
          },
          {
            "name": "`",
            "children": [
              "code"
            ]
          },
          "text"
        ]
      );
    });
  });
});