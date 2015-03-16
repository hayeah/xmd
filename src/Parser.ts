export = Parser;

import LineReader = require("./LineReader");
import Line = require("./Line");
import Tag = require("./Tag");

class Parser {
  reader: LineReader;

  constructor(data: string) {
    this.reader = new LineReader(data);
  }

  parse(): Tag {
    var doc = new Tag("document");
    var nodes = this._parse(0);
    doc.children = nodes;
    return doc;
  }

  _parse(baseIndent: number): Array<Tag> {
    var nodes: Array<Tag> = [];
    while(true) {
      var line = this.reader.peekNextLine();
      if(!line) { // EOF
        break;
      }

      if(line.indent < baseIndent) {
        // Detected outdent. stop parsing at this indentation level.
        break;
      }

      var node: Tag;

      if(line.content[0] == "#") {
        node = this.parseTag();
      } else {
        node = this.parseTextBlock();
      }

      if(node) {
        nodes.push(node);
      }

    }

    return nodes;
  }

  parseTag(): Tag {
    var tagOpenLine = this.reader.readNextLine();
    // Shouldn't be null.
    if(!tagOpenLine) {
      return null;
    }


    var tagname = parseTagName(tagOpenLine.content); // TODO parse tagname
    var tag = new Tag(tagname);
    var nextl = this.reader.peekNextLine();
    if(!nextl) { // EOF
      // empty tag
      return tag;
    }

    if(nextl.indent <= tagOpenLine.indent) { // outdent
      // empty tag
      return tag;
    }

    // Recursive parsing.
    var nodes = this._parse(nextl.indent);
    tag.children = nodes;

    return tag;


  }

  parseTextBlock(): Tag {
    var p = new Tag("p");

    // merge lines of a text block
    var blockRawLines = [];
    while(true) {
      var line = this.reader.readNextLine();
      if(!line) {
        break;
      }

      blockRawLines.push(line.content);

      var nextLine = this.reader.peekNextLine();
      if(!nextLine) { // EOF
        break;
      }

      if(nextLine.indent < line.indent) { // outdent
        break;
      }

      if(nextLine.content[0] === "#") {
        break;
      }


      if(nextLine.lineno - line.lineno > 1) {
        break;
      }
    }
    // TODO parse block content
    p.children.push(blockRawLines.join(" "));
    return p;
  }
}

function parseTagName(data): string {
  // TODO support tag parameters
  var name = data.substr(1).trim();
  return name;
}
