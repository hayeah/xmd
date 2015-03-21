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

  /*
   * Read a symbol at current position.
   *
   * Symbo is used as tag names, tag arguments, and heredoc tokens.
   *
   * @grammar <symbol>
   */
  readSymbol(): string {
    // TODO
    if(this.ch === '"') {
      throw "Quoted symbol not yet implemented"
    } else {
      return this.readIf((c) => {
        return !(
          c == " "  ||
          c == "\n" ||
          c == "["  ||
          c == "]"  ||
          c == "\"" ||
          c == "="
          );
      });
    }
  }

  parseTag(indent: number): Tag {
    this.wantIndent(indent);
    this.want("#");
    // get tagname
    var tagName = this.readSymbol();
    var tag = new Tag(tagName);

    if(this.ch == "[") {
      this.want("[");
      var args = this.parseArguments();
      tag.setInfo(args);
      this.want("]");
    }

    if(this.ch == "\n") {
      this.read();
    } else {
      // TODO tag inline content
    }



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
    return this.parseHeredoc("```");
  }

  /*
   * Heredoc for quoted Code.
   *
   * Grammar: <string-heredoc(n)>
   */
  parseStringHeredoc(indent:number=0): Tag {
    return this.parseHeredoc('"""');
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

  /*
   * Parses a delimited list of arguments. Arguments list should end with `]`
   *
   * Grammar: <arguments>
   */
  parseArguments(): TagInfo  {
    // must be on one-line
    // stops when it sees "]"
    var opts: {[key:string]: string} = {};
    var args = [];

    while(true) {
      this.readIf((c) => {return c == " "});

      if(this.eof || this.ch === "\n" || this.ch === "]") {
        break;
      }

      var arg = this.readSymbol();
      if(arg === "") {
        break;
      }
      if(this.ch === "=") {
        this.want("=");
        var key = arg;
        var val = this.readSymbol();
        opts[key] = val;
      } else {
        args.push(arg);
      }
    }

    return {opts: opts, args: args};
  }
}

interface TagInfo {
  opts: {[key:string]: string};
  args: string[];
}