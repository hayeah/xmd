export = TextParser;

import Tag = require("./Tag");
import Reader = require("./Reader");
type Node = Tag | string;

class TextParser extends Reader {
  parse(): Array<Node> {
    return this._parse(false);
  }

  _parse(recursive:boolean): Array<Node> {
    var nodes: Array<Node> = [];

    while(true) {
      var str = this.readString();
      if(str != "") {
        nodes.push(str);
      }

      if(this.eof) {
        break;
      }

      var c = this.ch;
      switch(c) {
        case "*": // `_
        case "_":
        case "`":
          var tag = this.parseDelimitedTag();
          nodes.push(tag);
          break;
        case "[":
          nodes.push(this.parseInlineTag());
          break;
        case "]":
          // throws error if parsing is not in recursive mode
          // allow the recursive caller to consume "]"
          if(!recursive) {
            throw "excess ]";
          }
          return nodes;
        default:
          throw "not implemented";
      }
    }

    if(recursive) {
      throw "expecting ]";
    }

    return nodes;
  }

  parseInlineTag(): Tag {
    // parse tag
    this.want("[");
    // parse tag name
    var tagName = this.readSymbol();
    if(tagName == "") {
      throw "Inline tag cannot have empty name";
    }

    var info = this.parseArguments();
    this.want("]");

    var nodes: Array<Node>;
    // tag content is optional
    if(this.ch == "[") {
      this.want("[");
      nodes = this._parse(/*recursive=*/true);
      this.want("]");
    } else {
      nodes = [];
    }

    var tag = new Tag(tagName,nodes);
    tag.setInfo(info);

    return tag;
  }

  /**
   * Reads string upto (but excluding) a reserved char.
   */
  readString(): string {
    var acc = "";
    while(true) {
      if(this.eof) {
        break;
      }

      var c = this.ch;
      if(c === "*" || c === "[" || c === "]" || c === "`" || c === "_") {
        break;
      }

      if(c == "\\") {
        this.read();
        if(this.eof) {
          throw "Axpecting an escaped char, but end of file";
        }
        c = this.ch;
      }

      this.read();
      acc += c;

    }

    return acc;
  }

  // Read content delimited by asterisks.
  parseDelimitedTag(): Tag {
    var delimiter = this.ch;
    if(this.peek(1) === '`') {
      delimiter = '``'
    }
    var content = this.readDelimited(delimiter);
    if(content == null) {
      // TODO: error should contain the context of the bold starting.
      throw "could not find end of tag delimited by";
    }

    if(content == "") {
      throw `Content between #{delimiter} cannot be empty`;
    }

    // TODO: it should be error if tag content is empty?
    return new Tag(delimiter, [content]);
  }
}
