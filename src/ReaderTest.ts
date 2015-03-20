///<reference path="./test.d.ts" />
import Reader = require("./Reader");

describe("Reader",() => {

  describe("#wantAll",() => {
    function wantAll(src:string,pat:string): string {
      var r = new Reader(src);
      r.wantAll(pat);
      return r.residue();
    }

    it("throws error if cannot read the specified string",() => {
      assert.throw(() => {
        wantAll("abcdefg","abcdd");
      });
    });

    it("does nothing if given an empty string",() => {
      var residue = wantAll("abc","");
      assert.equal(residue,"abc");
    });

    it("advances reader position", () => {
      var residue;
      assert.doesNotThrow(() => {
        residue = wantAll("abcde","abc");
      });

      assert.equal(residue,"de");
    });
  });

  describe("#readUpto",() => {
    function readUpto(src:string, delimiter: string, expect?: string): string {
      var r = new Reader(src);
      var result = r.readUpto(delimiter)
      if(expect != null) {
        assert.equal(result,expect);
      }
      return r.residue();
    }

    it("returns the content upto, but exclude a string",() => {
      readUpto("abcd#rest","#","abcd");
      readUpto("ab#cd##rest","##","ab#cd");
      readUpto("##rest","##","");
    });

    it("reads nothing if reading upto the empty string",() => {
      var residue = readUpto("abc","","");
      assert.equal(residue,"abc");
    });

    it("advances reader position",() => {
      var residue = readUpto("abc#rest","#","abc");
      assert.equal(residue,"#rest");
    });
  });

  describe("#readDelimited", () => {
    function readDelimited(src: string, delimiter: string, expect?: string): string {
      var r = new Reader(src);
      var result = r.readDelimited(delimiter);
      if(expect != null) {
        assert.equal(result,expect);
      }
      return r.residue();
    }

    it("returns the content string between delimiters", () => {
      readDelimited("*content*","*","content");
      readDelimited("**","*","");
      readDelimited("**content**","**","content");
    });

    it("throws error if end delimiter cannot be found", () => {
      assert.throw(() => {
        readDelimited("*content","*");
      });
    });

    it("advances parser's position", () => {
      var residue = readDelimited("*content*more stuff","*");
      assert.equal(residue,"more stuff");
    });
  });
});

