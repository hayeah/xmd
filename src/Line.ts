class Line {
  indent: number;
  // stripped of indent and newline
  content: string;
  lineno: number;

  constructor(content: string, indent: number, lineno: number) {
    this.indent = indent;
    this.content = content;
    this.lineno = lineno;
  }
}

export = Line;