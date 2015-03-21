///<reference path="./test.d.ts" />

import Tag = require("./Tag");
import xmd = require("./Xmd");

describe("xmd",() => {
  describe(".xmd2html",() => {
    var xmd2html = xmd.xmd2html;

    it("transforms headers",() => {
      function t(from,to) {
        assert.equal(xmd2html(new Tag(from)).name,to);
      }

      t("","h1");
      t("#","h2");
      t("##","h3");
      t("###","h4");
      t("####","h5");
      t("#####","h6");
    });
  });
});