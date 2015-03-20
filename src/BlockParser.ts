import Tag = require("./Tag");
import Reader = require("./Reader");
import LineType = require("./LineType");

type Node = Tag | string;
interface LineInfo {
  type: LineType;
  indent?: number
}

export = BlockParser;

class BlockParser extends Reader {
  /*
   * Detect indentation and type for current line.
  */
  lineInfo(): LineInfo {
    if(this.eof) {
      return null;
    }

    var i = this.at;
    var blank = true;
    var indent = 0;
    var c: string;
    while(true) {
      c = this.src[i];

      if(c == null) {
        break;
      }

      if(c == "\n") {
        break;
      }

      if(c == " ") {
        indent++;
      } else {
        blank = false;
        break;
      }

      i++;
    }

    var type: LineType;
    if(blank) {
      type = LineType.empty;
      indent = null;
    } else {
      type = LineType.text;

      if(c == "#") {
        type = LineType.tag;
      }

      if(c == "`" && this.src.substr(i,3) == "```") {
        type = LineType.hereCode;
      }

      if(c == "\"" && this.src.substr(i,3) == '"""') {
        type = LineType.hereString;
      }
    }

    return {type: type, indent: indent};
  }

  _parse(indent:number): Node[] {
    var nodes: Node[] = [];

    while(true) {
      this.skipEmptyLines();
      if(this.eof) {
        break;
      }
      var info = this.lineInfo();
      if(info.indent < indent) { // outdent
        break;
      }

      if(info.indent > indent) {
        throw "Unexpected indentation";
      }

      switch(info.type) {
      case LineType.text:
        nodes.push(this.readTextBlock(indent));
        break;
      case LineType.tag:
        nodes.push(this.parseTag(indent));
        break;
      default:
        throw "unknown line type";
      }
    }

    return nodes;
  }

  skipEmptyLines() {
    while(true) {
      if(this.eof) {
        return;
      }

      var info = this.lineInfo();
      if(info.type != LineType.empty) {
        break;
      }
      this.readLine(0); // FIXME: could do it more efficiently...
    }
  }

  parseTag(indent: number): Tag {
    this.wantIndent(indent);
    this.want("#");
    // get tagname
    var tagName = this.readIf((c) => {return c != "\n" && c != "[" && c != " "});

    if(this.ch == "\n") {
      this.read();
    }

    // TODO tag inline content
    // TODO argument parsing

    var tag = new Tag(tagName);

    this.skipEmptyLines();
    if(this.eof) {
      return tag;
    }

    var info = this.lineInfo();

    if(info.indent != indent + 2) {
      return tag;
    }

    // parse recursively
    tag.children = this._parse(indent + 2);
    return tag;
  }

  /**
   * Read up to the next non-whitespace char.
   * Tabs ("\t") are not allowed.
   * @return The indentation level.
   */
  readUptoNextIndent(): number {
    var indent = 0;
    return indent;
  }

  readTextBlock(indent:number): string {
    var lines = [];
    while(true) {
      // Consume a line.
      var line = this.readLine(indent);
      lines.push(line);
      // concat line

      // Decide if the new line is part of the text block.
      var info = this.lineInfo();

      if(info == null || info.type != LineType.text) {
        break;
      }

      if(info.indent != indent) {
        break;
      }

      continue;
    }

    return lines.join("\n");
  }

  /*
   * Read a line at a specified indentation level.
   */
  readLine(indent: number): string {
    // consume indentation
    this.wantIndent(indent);

    var line = this.readIf((c) => { return c != "\n" });

    // consume newline
    if(this.ch == "\n") {
      this.read();
    }

    return line;
  }

  wantIndent(indent: number) {
    for(;indent > 0; indent--) {
      if(this.ch != " ") {
        throw `Expects indent level: ${indent}`
      }
      this.read();
    }
  }

  // parseCodeHereDoc(): Tag {
  //   var heretoken: string;
  //   var heredone = "```" + heretoken; // e.g. ```HERE
  //   readLine();

  //   // error if indentation is less than heredoc indentation.


  //   if(line.content.rightTrim() == heredoc)
  //     stop

  // }

  // parseHereDoc(): string {
  //   // same same, different delimiter
  // }

}