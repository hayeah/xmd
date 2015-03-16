import Line = require("./Line");

class LineReader {
  // These are for internal tracking purposes only.
  indent: number;
  lineno: number;
  pos: number;
  isEOF: boolean;

  data: string;

  nextLine: Line;

  // peek(n: number) {
  //   return data[pos+n];
  // }

  constructor(data: string) {
    this.data = data;
    this.indent = 0;
    this.lineno = 1;
    this.pos = 0;
    this.isEOF = false;
    this.nextLine = null;
  }


  // peek & buffer the next line
  peekNextLine(): Line {
    if(this.nextLine != null) {
      return this.nextLine;
    }

    if(this.isEOF) {
      return null;
    }

    this._skipWhitespace();

    if(this.isEOF) {
      return null;
    }

    var lineContent = this._readToEndOfLine();
    var line = new Line(lineContent,this.indent,this.lineno);
    this.nextLine = line;
    return this.nextLine;
  }

  hasNextLine(): boolean {
    return !!this.peekNextLine();
  }

  // return next line, and advance reader position.
  readNextLine(): Line {
    // load line into buffer
    var line = this.peekNextLine();
    // clear line buffer so next read will advance
    this.nextLine = null;
    return line;
  }

  // Read up to (but not including) newline or EOF
  _readToEndOfLine(): string {
    var from = this.pos;
    var found = false;
    for (; this.pos < this.data.length; this.pos++) {
      var c = this.data[this.pos];
      if(c == "\n") {
        found = true;
        break;
      }
    }

    this._checkEOF();

    if(found) {
      return this.data.slice(from,this.pos);
    } else {
      return this.data.slice(from);
    }

  }

  _checkEOF(): void {
    this.isEOF = !(this.pos < this.data.length);
  }

  // TODO: how do i handle tabs?
  // 1. disallow tabs?
  // 2. or track indentation type?
  _skipWhitespace() {
    for (; this.pos < this.data.length; this.pos++) {
      var c = this.data[this.pos];

      if(c == "\t") {
        throw "cannot use tab for now";
      }

      if(c == " ") {
        this.indent++;
        continue;
      }

      if(c == "\n") {
        this.indent = 0;
        this.lineno++;
        continue;
      }

      break;
    }

    this._checkEOF();
  }
}

export = LineReader;