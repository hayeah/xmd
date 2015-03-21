import BlockParser = require("./BlockParser");
import LineType = require("./LineType");
import fs = require("fs");

function assertParse(a,b) {
  assert.deepEqual(JSON.parse(JSON.stringify(a)),b);
}

interface TestOpt {
  assert?: any;
  show?: boolean;
}

function parserTest(parser,method,opts?:TestOpt) {
  if(opts == null) {
    opts = {};
  }

  var assertFn = opts.assert || assert.deepEqual;


  return function(src,expect,...args): string {
    var p = new parser(src);
    var result = p[method].apply(p,args);
    if(opts && opts.show == true) {
      console.log(JSON.stringify(result,null,2));
    }

    if(expect !== undefined) {
      assertFn(result,expect);
    }
    return p.residue();
  }
}

describe("BlockParser",() => {
  describe("#lineInfo",() => {
    function lineInfo(src:string) {
      var p = new BlockParser(src)
      return p.lineInfo();
    }

    it("detects empty line",() => {
      var info = lineInfo("      ");
      assert.equal(info.type, LineType.empty);
      assert.isNull(info.indent);
    });

    it("detects tag",() => {
      var info = lineInfo("  #");
      assert.equal(info.type, LineType.tag);
      assert.equal(info.indent,2);
    });

    it("detects text",() => {
      var info = lineInfo("    hello");
      assert.equal(info.type, LineType.text);
      assert.equal(info.indent,4);

      var info = lineInfo("  `hello");
      assert.equal(info.type, LineType.text);
      assert.equal(info.indent,2);

      var info = lineInfo("``hello");
      assert.equal(info.type, LineType.text);
      assert.equal(info.indent,0);
    });

    it("detects code heredoc",() => {
      var info = lineInfo("    ```");
      assert.equal(info.type, LineType.hereCode);
      assert.equal(info.indent,4);
    });

    it("detects string heredoc",() => {
      var info = lineInfo('  ````');
      assert.equal(info.type, LineType.hereString);
      assert.equal(info.indent,2);
    });

    it("returns null for eof",() => {
      assert.isNull(lineInfo(""));
    });
  });

  describe("#readLine", () => {
    var readLine = parserTest(BlockParser,"readLine");

    it("reads an indented line",() => {
      var residue = readLine("  abcd\nmore","abcd",2);
      assert.equal(residue,"more");
    });

    it("throws error if line is not indented enough",() => {
      assert.throw(() => {
        readLine("  abcd",undefined,4);
      });
    });
  });

  describe("#readTextBlock",() => {
    var readTextBlock = parserTest(BlockParser,"readTextBlock",{
      assert: assertParse,
      // show: true
    });

    it("collect consecutive text lines together",() => {
      var text = "  abc\n  def\n  ghi";
      var _ = readTextBlock(text,{
        "name": "p",
        "children": [
          "abc def ghi"
        ]
      },2);
      assert.equal(_,"");
    });

    it("ends a text block on outdent",() => {
      var text = "  abc\n  def\nghi";
      var _ = readTextBlock(text,{
        "name": "p",
        "children": [
          "abc def",
        ]
      },2);
      assert.equal(_,"ghi");
    });

    it("ends a text block on empty line",() => {
      var text = "  abc\n  def\n  \nghi";
      var _ = readTextBlock(text,{
        "name": "p",
        "children": [
          "abc def",
        ]
      },2);
      assert.equal(_,"  \nghi");
    });

    it("ends a text block on non-text line",() => {
      var text;
      var _;

      text = "  abc\n  def\n  #tag";
      _ = readTextBlock(text,undefined,2);
      assert.equal(_,"  #tag");

      text = "  abc\n  def\n  ```";
      _ = readTextBlock(text,undefined,2);
      assert.equal(_,"  ```");

      text = '  abc\n  def\n  ````';
      _ = readTextBlock(text,undefined,2);
      assert.equal(_,'  ````');
    });
  });

  describe("#parseArguments",() => {
    var parseArguments = parserTest(BlockParser,"parseArguments",{
      // show: true
    });

    it("throws error if = appears on its own");

    it("parses empty arguments",() => {
      parseArguments("",{
        "opts": null,
        "args": null
      });
    });

    it("parses arguments",() => {
      var _ = parseArguments("  a b=bar c  ]more",{
        "opts": {
          "b": "bar"
        },
        "args": [
          "a",
          "c"
        ]
      });

      assert.equal(_,"]more")
    });
  });

  describe("#parseCodeHeredoc",() => {
    var parseCodeHeredoc = parserTest(BlockParser,"parseCodeHeredoc",{
      assert: assertParse,
      // show:true
    });

    it("throws error if heredoc is not closed")

    it("parses empty heredoc",() => {
      var doc;
      doc = "```\n```";
      parseCodeHeredoc(doc,{
        "name": "```",
        "children": []
      });
    });

    it("parses multiple lines of quoted text",() => {
      var doc = "```\n  \n\n  a\n  b\n  c\n```";
      parseCodeHeredoc(doc,{
        "name": "```",
        "children": [
          "  \n\n  a\n  b\n  c"
        ]
      });
    });

    it("allows closing to be trailed with space",() => {
      var doc;
      doc = "```\ncontent\n```   \n";
      parseCodeHeredoc(doc,{
        "name": "```",
        "children": [
          "content"
        ]
      });

      doc = "```HERE\ncontent\n```HERE   \n";
      parseCodeHeredoc(doc,{
        "name": "```",
        "children": [
          "content"
        ]
      });
    });

    it("closes with user defined heredoc token",() => {
      var doc = "```FOOBAR\ncontent\n```\n```FOOBAR\n";
      parseCodeHeredoc(doc,{
        "name": "```",
        "children": [
          "content\n```"
        ]
      });
    });

    it("parses heredoc arguments",() => {
      var doc = "```[a b=b c]HERE\ncontent\n```HERE\nmore";
      var _ = parseCodeHeredoc(doc,{
        "name": "```",
        "children": [
          "content"
        ],
        "opts": {
          "b": "b"
        },
        "args": [
          "a",
          "c"
        ]
      });
    });

    it("parses indented heredoc",() => {
      var doc =
`  \`\`\`
  hello
  world
  \`\`\`
`
      parseCodeHeredoc(doc,{
        "name": "```",
        "children": [
          "hello\nworld"
        ]
      },2);
    });

    it("advances reader position",() => {
      var doc = "```HERE\ncontent\n```HERE\nmore";
      var _ = parseCodeHeredoc(doc,undefined);
      assert.equal(_,"more");
    });
  });

  describe("#parseStringHeredoc", () => {
    var parseStringHeredoc = parserTest(BlockParser,"parseStringHeredoc",{
      assert: assertParse,
      // show: true
    });
    it("parses string quoted by heredoc",() => {
      var doc = '````HERE\ncontent\n````HERE\nmore';
      var _ = parseStringHeredoc(doc,{
        "name": "````",
        "children": [
          "content"
        ]
      });
      assert.equal(_,"more");
    });
  });

  describe("#parseTag",() => {
    var parseTag = parserTest(BlockParser,"parseTag",{
      assert: assertParse,
      // show: true
    });

    it("parses tag that has no content",() => {
      parseTag("#foo",{
        "name": "foo",
        "children": []
      });
    });


    it("parses tag that has content",() => {
      var doc =
`
#foo
  first block
  of foo

  second block
  of foo
`.trim();

      parseTag(doc,{
        "name": "foo",
        "children": [
          {
            "name": "p",
            "children": [
              "first block of foo"
            ]
          },
          {
            "name": "p",
            "children": [
              "second block of foo"
            ]
          }
        ]
      },0);
    });

    it("parses tag recursively",() => {
      var doc =
`
#foo
  first block of foo
  #bar
    content of bar
  second block of foo
more content
`.trim();

      var _ = parseTag(doc,{
        "name": "foo",
        "children": [
          {
            "name": "p",
            "children": [
              "first block of foo"
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
              "second block of foo"
            ]
          }
        ]
      },0);

      assert.equal(_,"more content");
    });

    it("ignores empty lines",() => {
      var doc =
`
#foo

  first block of foo

  #bar

    content of bar

  second block of foo


more content
`.trim();

      var _ = parseTag(doc,{
        "name": "foo",
        "children": [
          {
            "name": "p",
            "children": [
              "first block of foo"
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
              "second block of foo"
            ]
          }
        ]
      },0);

      assert.equal(_,"more content");
    });

    it("parses tag arguments",() => {
      parseTag("#tag[a b=b c]",{
        "name": "tag",
        "children": [],
        "opts": {
          "b": "b"
        },
        "args": [
          "a",
          "c"
          ]
      });
    });
  });

  describe("#parse",() => {
    function parse(srcFile,astFile) {
      var src = fs.readFileSync(srcFile,"utf8");
      var ast = fs.readFileSync(astFile,"utf8");
      var p = new BlockParser(src);
      var result = p.parse();
      assert.deepEqual(JSON.parse(result.json()),JSON.parse(ast))
    }

    it("parses a complete document",() => {
      parse("./examples/simple.xmd","./examples/simple.xmd.json")
    });
  });
});