
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
        default: {
          return new Tag(node.name,recur());
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