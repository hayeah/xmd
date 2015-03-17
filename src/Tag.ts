export = Tag;

type Node = Tag | string;

class Tag {
  name: string;
  children: Array<Node>;

  constructor(name: string, children?: Node[]) {
    this.name = name;
    this.children = children || [];
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

  xml(opts?: XMLOutputOptions): string {
    var xml = "";
    if(opts == null) {
      opts = {};
    }

    var pretty = opts.indent != null;
    var indentSpaces = opts.indent || 2;
    var indent = 0;
    this.walk((node,recur) => {
      if(typeof node === 'string') {
        output(node);
      } else {
        output(`<${node.name}>`);
        indent += indentSpaces;
        recur();
        indent -= indentSpaces;
        output(`</${node.name}>`)
      }
    });

    function output(str) {
      if(pretty && indent > 0) {
        xml += spaces.substr(0,indent);
      }
      xml += str;
      xml += "\n"
    }
    return xml;
  }
}

interface XMLOutputOptions {
  indent?: number;
}
var spaces = "                                                                                                         ";