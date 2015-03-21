///<reference path="./test.d.ts" />

import Tag = require("./Tag");
import xmd = require("./Xmd");

describe("xmd",() => {
  describe(".xmd2html",() => {
    var xmd2html = xmd.xmd2html;
    function tagname(from,to) {
       assert.equal(xmd2html(new Tag(from)).name,to);
    }
    it("transforms headers",() => {
      tagname("","h1");
      tagname("#","h2");
      tagname("##","h3");
      tagname("###","h4");
      tagname("####","h5");
      tagname("#####","h6");
    });

    it("transforms quoted literals",() => {
      tagname("*","b");
      tagname("_","i");
      tagname("`","code");
      tagname("```","code");
    });

    it("transforms inline string quote to string",() => {
      var foo = new Tag("foo",[new Tag("``",["abcd"])]);
      assert.deepEqual(xmd2html(foo).children,["abcd"]);
    });

    it("transforms links",() => {
      var a: Tag;
      a = new Tag(">");
      a.setInfo({args: ["http://google.com"]})
      var a_ = xmd2html(a);
      assert.equal(a_.name,"a");
      assert.equal(a_.opts["href"],"http://google.com");
      assert.deepEqual(a_.children,["http://google.com"]);

      a.children = ["The Google"];
      a_ = xmd2html(a);
      assert.deepEqual(a_.children,["The Google"]);

    });
  });
});