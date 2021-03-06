import TagInfo = require("./TagInfo");

export = Reader;
class Reader {
  src: string;
  at: number;
  // // line count
  // private line: number;
  // // column count
  // private col: number;

  eof: boolean;
  ch: string;

  constructor(src: string) {
    this.src = src;
    this.at = 0;
    this.ch = this.src[this.at];
    this.eof = this.ch == null;

  }

  read(): string {
    var c = this.ch;
    this.at += 1;
    this.ch = this.src[this.at];

    if(this.ch == null) {
      this.eof = true;
    }
    return c;
  }

  peek(n:number): string {
    return this.src[this.at+n];
  }

  setAt(at: number) {
    this.at = at;
    this.ch = this.src[this.at];
    if(this.ch == null) {
      this.eof = true;
    }
  }

  want(e: string) {
    if(e && e != this.ch) {
      throw "Expected '" + e + "' instead of '" + this.ch + "'";
    }
    this.read();
  }

  wantAll(str: string) {
    for(var i = 0; i < str.length; i++) {
      if(this.ch != str[i]) {
        throw `Expected ${str[i]} instead of ${this.ch}`;
      }
      this.read();
    }
  }

  /**
   * Consume input up to but not including a string pattern.
   */
  readUpto(str: string): string {
    var endPos = this.src.indexOf(str,this.at)
    if(endPos == -1) {
      return null;
    }
    var content = this.src.slice(this.at,endPos);
    this.setAt(endPos);
    return content;
  }

  // <s>content string<s>
  readDelimited(delimiter:string): string/*null*/ {
    this.wantAll(delimiter);
    var content = this.readUpto(delimiter);
    if(content == null) {
      throw `Unable to find closing ${delimiter}`
    }
    this.wantAll(delimiter);
    return content;
  }

  readIf(test: (c:string) => boolean): string {
    var acc = "";
    while(true) {
      if(this.eof) {
        break;
      }

      if(test(this.ch)) {
        acc += this.read();
      } else {
        break;
      }
    }
    return acc;
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

    var hasKV = false;

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
        hasKV = true;
      } else {
        args.push(arg);
      }
    }

    if(args.length == 0) {
      args = null;
    }

    if(!hasKV) {
      opts = null;
    }

    return {opts: opts, args: args};
  }

  residue(): string {
    return this.src.slice(this.at);
  }
}