
import Parser = require("./BlockParser");
import Tag = require("./Tag");

export function parse(src: string): Tag {
  var parser = new Parser(src);
  var doc = parser.parse();
  return doc;
}

export function renderJSON(src: string, opts?: {indent?: number; raw?: boolean}): string {
  if(opts == null) {
    opts = {};
  }
  var doc = parse(src);
  opts.raw = !!opts.raw;
  if(!opts.raw) {
    doc = xmd2html(doc);
  }
  return doc.json(opts);
}

export function renderXML(src: string, opts?: {indent?: number}): string {
  var doc = xmd2html(parse(src));
  return doc.xml(opts);
}

/*
  Rewrite markdown tags to html tags.
    "" => "h1"
    "#" => "h2"
    "##" => "h3"
    "*" => "bold"
    "_" => "italic"
    etc.
*/
export function xmd2html(doc: Tag): Tag {
  var doc2 = doc.transform((node,recur) => {
    if(typeof node === 'string') {
      return node
    } else {
      switch(node.name) {
        case "": {
          // Since a tag starts with `#`, the tag with the empty name is a hack for h1.
          return new Tag("h1",recur());
        }
        case "#": {
          return new Tag("h2",recur());
        }
        case "##": {
          return new Tag("h3",recur());
        }
        case "###": {
          return new Tag("h4",recur());
        }
        case "####": {
          return new Tag("h5",recur());
        }
        case "#####": {
          return new Tag("h6",recur());
        }
        case "*": {
         return new Tag("b",recur());
        }
        case "_": {
         return new Tag("i",recur());
        }

        case "`": {
          return new Tag("code",recur());
        }
        case "```": {
          var code = new Tag("code",recur());
          if(node.args != null) {
            code.opts = {lang: node.args[0]};
          }
          return new Tag("pre",[code]);
        }
        case "``":
        case "````": {
         return node.children[0];
        }
        case "list": {
          // look at the first list item to decide whether list should be ul or ol
          var li = <Tag> node.children[0];
          if(li == null) {
            return new Tag("ul");
          }

          var listTagName: string;
          if (li.name == "+") {
            if(li.args && li.args[0] === "1") {
                listTagName = "ol";
            } else {
              listTagName = "ul";
            }
          } else {
            listTagName = "list";
          }

          return new Tag(listTagName,recur());
        }
        case "+": {
          return new Tag("li",recur());
        }

        // [> http://google.com]
        // [> http://google.com][The Google]
        case ">": {
          var href = node.args[0];
          if(href == null) {
            href = "";
          }
          var a = new Tag("a")
          a.opts = {href: href};
          if(node.children.length == 0) {
            a.children = [href];
          } else {
            a.children = node.children;
          }
          return a;
        }
        default: {
          var t = new Tag(node.name,recur());
          t.opts = node.opts;
          return t;
        }
      }
    }
  });

  // Type testing to make the TypeScript compiler happy.
  if(typeof doc2 === "string") {
    // should't happen
    throw new Error("Implementation error. XMarkdown transform shouldn't result in string");
  } else {
    return doc2;
  }
}