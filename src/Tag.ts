export = Tag;

type Node = Tag | string;

interface TagInfo {
  opts?: {[key:string]: string};
  args?: string[];
}

class Tag {
  name: string;
  children: Array<Node>;
  opts: {[key:string]: string};
  args: string[];

  constructor(name: string, children?: Node[]) {
    this.name = name;
    this.children = children || [];
  }

  setInfo(info: TagInfo) {
    if(info.opts) {
      this.opts = info.opts;
    }

    if(info.args) {
      this.args = info.args;
    }
  }

  add(child: Node) {
    this.children.push(child);
  }

  transform(f: (node: Node, recur?: () => Array<Node>) => Node): Node {
    return f(this,() => {
      if(this.children.length == 0) {
        return this.children;
      }

      var newChildren: Node[] = [];
      for (var i = 0; i < this.children.length; i++){
        var node = this.children[i];
        if(typeof node === "string") {
          newChildren[i] = f(node);
        } else {
          newChildren[i] = node.transform(f);
        }
      }

      return newChildren;
    });
  }

  walk(f: (node: Node, recur?: () => void) => void) {
    f(this,() => {
      var nodes = this.children;
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if(typeof node === 'string') {
          f(node);
        } else {
          node.walk(f);
        }
      }
    });
  }

  json(opts?: {indent?: number}): string {
    if(opts == null) {
      opts = {};
    }
    var indent = opts.indent || 0;
    return JSON.stringify(this,null,indent);
  }

  xml(opts?: XMLOutputOptions): string {
    var xml = "";
    if(opts == null) {
      opts = {};
    }

    var pretty = opts.indent != null;
    var indentSpaces = opts.indent || 2;
    var indent = 0;
    var stopindent = false;
    this.walk((node,recur) => {
      if(typeof node === 'string') {
        if(pretty) {
          output("\n");
        }

        outputIndent(indent);
        output(node);
      } else {
        if(!pretty) {
          output(`<${node.name}>`);
          recur();
          output(`</${node.name}>`);
          return;
        }

        // pretty mode
        if(node.children.length == 0) {
          output("\n");
          outputIndent(indent);
          output(`<${node.name}/>`);
          return;
        }
        if(node.children.length == 1 &&  typeof node.children[0] === "string") {
          output("\n");
          outputIndent(indent);
          output(`<${node.name}>`);
          output(node.children);
          output(`</${node.name}>`);
        } else {
          var oldpretty = pretty;
          output("\n");
          outputIndent(indent);
          output(`<${node.name}>`);
          indent += indentSpaces;
          if(node.name === "p") {
            pretty = false;
          }
          recur();
          if(node.name === "p") {
            pretty = oldpretty;
          }
          indent -= indentSpaces;
          output(`</${node.name}>`)
        }
      }
    });

    function outputIndent(indent:number) {
      if(pretty && !stopindent && indent > 0) {
        xml += spaces.substr(0,indent);
      }
    }

    function output(str) {
      xml += str;
    }
    return xml;
  }
}

interface XMLOutputOptions {
  indent?: number;
}
var spaces = "                                                                                                         ";