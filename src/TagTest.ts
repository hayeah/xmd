///<reference path="./test.d.ts" />
import Tag = require("./Tag");

import test = require("./test");
var assertJSONEqual = test.assertJSONEqual;

describe("Tag",() => {
  describe("#walk", () => {
    it("walks the nodes depth-first", () => {
      var tag = new Tag("doc");
      var a = new Tag("a");
      a.add("a1");
      a.add("a2");
      var b = new Tag("b");
      b.add("b1");
      b.add("b2");
      tag.add(a);
      tag.add(b);
      tag.add("c");
      var nodes = [];
      tag.walk(function (node) {
          nodes.push(node);
      });
      assert.deepEqual([tag, a, "a1", "a2", b, "b1", "b2", "c"], nodes);
    });
  });

  describe("#transform",() => {
    it("transforms the recursive tag structure", () => {
      var tag = new Tag("doc");
      var a = new Tag("a");
      a.add("a1");
      var b = new Tag("b");
      b.add("b1");
      tag.add(a); tag.add(b);

      var tag2 = tag.transform((node,recur) => {
        if(typeof node === 'string') {
          return "#" + node;
        } else {
          var tag = new Tag("<" + node.name);
          tag.children = recur();
          return tag;
        }
      });

      assertJSONEqual(tag2,{
        "name": "<doc",
        "children": [
          {
            "name": "<a",
            "children": [
              "#a1"
            ]
          },
          {
            "name": "<b",
            "children": [
              "#b1"
            ]
          }
        ]
      });
    });
  });
});