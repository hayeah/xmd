///<reference path="./test.d.ts" />
import Reader = require("./Reader");

describe("Reader",() => {

  describe("#read",() => {
    var reader: Reader;

    beforeEach(() => {
      reader = new Reader("abc");
    });

    function read(expect?: string): string {
      var result = reader.read();
      if(expect != null) {
        assert.equal(result,expect);
      }
      return reader.residue();
    }

    it("returns the input characters in order",() => {
      assert.isFalse(reader.eof);
      assert.equal(reader.ch,"a");
      read("a");
      assert.equal(reader.ch,"b");
      read("b");
      assert.equal(reader.ch,"c");
      read("c");
      assert.isTrue(reader.eof);
    });
  });

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

