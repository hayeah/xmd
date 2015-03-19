export = TextParser;

import Tag = require("./Tag");

type Node = Tag | string;

class TextParser {
  private pos: number;

  constructor(private src: string) {
    this.pos = 0;
  }

  parse(): Array<Node> {
    var nodes: Array<Node> = [];
    // accumulate content string

    while(true) {
      var str = this.readString();
      if(str != "") {
        nodes.push(str);
      }

      if(this.src[this.pos] == null) {
        break;
      }

      var c = this.src[this.pos];
      switch(c) {
        case "*": // `_
        case "_":
        case "`":
          var tag = this.readDelimitedTag(c);
          nodes.push(tag);
          break;
        // case "`":
        // case "_":
        //   break;
        // case "[":
        //   break;
        // case "]":
        //   break;
        default:
          throw "not implemented";
      }
    }

    return nodes;
  }

  readInlineTag(): Tag {

  }

  /**
   * Reads string upto (but excluding) a reserved char.
   */
  readString(): string {
    var acc = "";
    while(true) {
      var c = this.src[this.pos];
      if(c == null) {
        break;
      }

      if(c === "*" || c === "[" || c === "]" || c === "`" || c === "_") {
        break;
      }

      if(c == "\\") {
        this.pos += 1;
        c = this.src[this.pos];
        if(c == null) {
          throw "Axpecting an escaped char, but end of file";
        }
      }

      this.pos += 1;
      acc += c;
    }

    return acc;
  }

  // Read content delimited by asterisks.
  readDelimitedTag(delimiter:string): Tag {
    var content = this.readDelimited(delimiter);
    if(content == null) {
      // TODO: error should contain the context of the bold starting.
      throw "could not find end of tag delimited by";
    }
    // TODO: it should be error if tag content is empty?
    return new Tag(delimiter, [content]);
  }

  // <s>content string<s>
  readDelimited(s:string): string/*null*/ {
    // skip the delimiter opening
    this.pos += s.length;
    var endPos = this.src.indexOf(s,this.pos)
    if(endPos == -1) {
      return null;
    }
    var content = this.src.slice(this.pos,endPos);
    this.pos = endPos += s.length;
    return content;
  }

  //
  residue(): string {
    return this.src.slice(this.pos);
  }
}
