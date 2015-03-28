import Tag = require("./Tag");
import Reader = require("./Reader");
import LineType = require("./LineType");
import TextParser = require("./TextParser");

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

      if(c == "+") {
        type = LineType.listItem;
      }

      if(c == "`") {
        if(this.src.substr(i,3) == "```") {
          if(this.src[i+3] === "`") { // ````
            type = LineType.hereString;
          } else {
            type = LineType.hereCode;
          }
        }
      }
    }

    return {type: type, indent: indent};
  }

  parse(): Tag {
    return new Tag("document",this._parse(0));
  }

  _parse(indent:number=0): Node[] {
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
      case LineType.listItem:
        nodes.push(this.parseList(indent));
        break;
      case LineType.hereString:
        nodes.push(this.parseStringHeredoc(indent));
        break;
      case LineType.hereCode:
        nodes.push(this.parseCodeHeredoc(indent));
        break;
      case LineType.empty:
        // do nothing
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

  /**
   * Parse a list of items. A list is a sequence of tags started
   * with `+`, and not broken by anything that's not a list item.
   *
   * Grammar: <list(n)>
   */
  parseList(indent: number=0): Tag {
    var items: Tag[] = [];

    while(true) {
      var info = this.lineInfo();
      if(this.eof) {
        break;
      }

      if(info.indent != indent) {
        break;
      }

      if(info.type != LineType.listItem) {
        break;
      }

      this.wantIndent(indent);
      this.want("+");

      var item = this.parseTagDef(indent);
      item.name = "+" + item.name;
      items.push(item);

      this.skipEmptyLines();
    }

    var list = new Tag("list",items)

    return list;
  }

  /**
   * Parses the tag name, argument, and content. A grammar shared by tag and list-item.
   * Grammar: <tag-def>
   */
  parseTagDef(indent: number=0): Tag {
    // Grammar: <symbol>
    var tagName = this.readSymbol();
    var tag = new Tag(tagName);

    // Grammar: <tag-arguments>?
    if(this.ch == "[") {
      this.want("[");
      var args = this.parseArguments();
      tag.setInfo(args);
      this.want("]");
    }

    // Grammar: <tag-inline-body>? <nl>
    var textLine = this.readIf((c) => {return c != "\n"}).trim();
    if(textLine != "") {
      var tp = new TextParser(textLine);
      tag.children = tp.parse();
    }

    if(this.ch == "\n") {
      this.read();
    }


    // Grammar: <tag-indented-body>?
    this.skipEmptyLines();
    if(this.eof) {
      return tag;
    }

    var info = this.lineInfo();


    if(info.indent != indent + 2) {
      // Detected indentation not belonging to this tag.
      return tag;
    }

    // parse recursively
    var body = this._parse(indent + 2);
    if(body.length > 0) {
      Array.prototype.push.apply(tag.children,body);
    }

    return tag;
  }

  /**
   * Parse and return a tag at specified indentation level.
   *.
   * Grammar: <tag(n)> :=
   *    <indent(n)> "#" <symbol> <tag-arguments>? <tag-inline-body>? <nl>
   *      <tag-indented-body(n)>?
   */
  parseTag(indent: number=0): Tag {
    this.wantIndent(indent); // indent(n)
    this.want("#");

    return this.parseTagDef(indent);
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

  readTextBlock(indent:number): Tag {
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

    var content = lines.join(" ");
    var tp = new TextParser(content);

    return new Tag("p",tp.parse());
  }

  /*
   * Read a line at a specified indentation level.
   */
  readLine(indent:number=0): string {
    // consume indentation
    this.wantIndent(indent);

    var line = this.readIf((c) => { return c != "\n" });

    // consume newline
    if(this.ch == "\n") {
      this.read();
    }

    return line;
  }

  wantIndent(indent:number=0) {
    for(;indent > 0; indent--) {
      if(this.ch != " ") {
        throw `Expects indent level: ${indent}`
      }
      this.read();
    }
  }

  /*
   * Heredoc for quoted Code.
   *
   * Grammar: <code-heredoc(n)>
   */
  parseCodeHeredoc(indent:number=0): Tag {
    return this.parseHeredoc("```",indent);
  }

  /*
   * Heredoc for quoted Code.
   *
   * Grammar: <string-heredoc(n)>
   */
  parseStringHeredoc(indent:number=0): Tag {
    return this.parseHeredoc('````',indent);
  }

  parseHeredoc(delimiter:string,indent:number=0): Tag {
    var tag = new Tag(delimiter);
    this.wantIndent(indent);
    this.wantAll(delimiter);

    if(this.ch == "[") {
      this.want("[");
      var args = this.parseArguments();
      tag.setInfo(args);
      this.want("]");
    }

    var symbol = this.readSymbol();
    this.want("\n");

    var heretoken = delimiter + symbol;

    var lines = [];
    while(true) {
      if(this.eof) {
        throw "EOF while parsing heredoc";
      }

      var line = this.readLine(indent);
      if(line.indexOf(heretoken) === 0 &&
         // allow spaces followinwg there heredoc close
         line.substr(heretoken.length).trim() === "") {
        break;
      }

      lines.push(line);
    }

    var content = lines.join("\n");
    if(content != "") {
      tag.children = [content];
    }

    return tag;
  }


}