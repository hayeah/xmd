export = Tag;

type Node = Tag | string;

class Tag {
  name: string;
  children: Array<Node>;

  constructor(name: string) {
    this.name = name;
    this.children = [];
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

  walk(f: (node: Node) => void) {
    f(this);

    var nodes = this.children;
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if(typeof node === 'string') {
        f(node);
      } else {
        if(node.children.length > 0) {
          node.walk(f);
        }
      }
    }
  }
}