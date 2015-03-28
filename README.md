Markdown is great if you can find a dialect that suits your needs precisely. But if you need some feature that it doesn't support, you are tempted to enter into a state of sin. You might try to:

1. Embed XML in your Markdown.
2. Have a fancy pre/post-process chain.
3. Find another markdown dialect.

Either of these makes me feel dirty.

Nor do I want to add more ad-hoc, nilly-willy extensions to Markdown.

One way to think about Markdown is that it is a dialect of XML that makes writing in it more pleasant. To create an extensible Markdown dialect, all you need to do is to make its syntax regular enough that it can express arbitrary XML in it.

I want a Markdown dialect to have equivalent expressive power as XML. Something like a hybrid between HAML and Markdown.

## Example

A simple document looks very similar to markdown.

    ```
    # The Title

    The _first_ paragraph of text
    spans two lines.

    The *second* paragraph of text
    spans
    three lines.

    ## A `Subtitle`

    #aside
      Marginally interesting aside.

      Also, see [> http://example.com][external link]

    A code snippet:

    ```[javascript theme=dark]
    function() {
      console.log("hello world");
    }
    ```

Consecutive lines are joined together to form a paragraph.

# Install

From NPM,

```
npm install xmd
```

## Command line

The command line tool can render an `.xmd` file to XML or JSON.

```
$ xmd --help
Renders extensible markdown to xml (defualt) or json.

  --ast           output parsed document in JSON
  -j, --json      output JSON
  -p, --pretty    pretty print the output
  -h, --help      show help
```

By default it renders to XML:

```
$ xmd --pretty example.xmd
<document>
    <h1>The Title</h1>
    <p>The <i>first</i> paragraph of text spans two lines.</p>
    <p>The <b>second</b> paragraph of text spans three lines.</p>
    <h2>
        A
        <code>Subtitle</code></h2>
    <aside>
        <p>Marginally interesting aside.</p>
        <p>Also, see <a href="http://example.com">external link</a></p></aside>
    <p>A code snippet:</p>
    <pre><code lang="javascript">function() {
  console.log("hello world");
}</code></pre></document>
```

Or you can choose to output to JSON, which you can then process with another tool:

```
$ xmd --json --pretty examples/simple.xmd
{
    "name": "document",
    "children": [
        {
            "name": "h1",
            "children": [
                "The Title"
            ]
        },
// ...
}
```

You can also print out the AST in JSON:

```
xmd --ast --pretty examples/simple.xmd
{
    "name": "document",
    "children": [
        {
            "name": "",
            "children": [
                "The Title"
            ]
        },
// ...
}
```

## Use in code

```javascript
> var xmd = require("xmd")

// xml output
> xmd.renderXML("# hello *world*")
'<document><h1>hello <b>world</b></h1></document>'

// JSON output
> xmd.renderJSON("# hello *world*")
{
  "name": "document",
  "children": [
    {
      "name": "h1",
      "children": [
        "hello ",
        {
          "name": "b",
          "children": [
            "world"
          ]
        }
      ]
    }
  ]
}

// AST
> xmd.renderJSON("# hello *world*",{raw: true})
'{"name":"document","children":[{"name":"","children":["hello ",{"name":"*","children":["world"]}]}]}'
```

# Extensible Markdown

The design criteria for this dialect are:

+ Minimal syntax that resembles markdown (not xml).
+ Well-defined escape and quoting mechanism.
+ Easy to attach metadata to content.
+ Pure syntax. Plug in your own semantics and renderer.

## Tag

We want to be able to express arbitrary XML tags. The character `#` opens a tag.

```
#foo
```

is translated to:

```
<foo/>
```

A single line of content can follow the tag opening,

```
#foo a line of content
```

is translated to:

```
<foo>a line of content</foo>
```

The tag name can be _almost_ anything. All of the followings are valid tags:

```
#+hoho+
#123blah123
#<<!--foo--!>>
#
```

In fact, the tag `#` that stands for `h1` is actually a tag whose name is empty!

```
# is h1 whose tag name is ""
## is h2 whose tag name is "#"
### is h3 whose tag name is "##"
#### is h4 whose tag name is "###"
##### is h5 whose tag name is "####"
###### is h6 whose tag name is "#####"
```

## Nesting

We use indentation to structure the document. Content nested within a tag MUST be indented with 2 spaces.

```
#tag1 content of tag 1
  #tag2 content of tag 2
    #tag3 content of tag 3
```

is translated to:

```
<tag1>
  content of tag 1
  <tag2>
    content of tag 2
    <tag3>content of tag 3</tag3></tag2></tag1>
```

## Paragraphs

Lines of of text are joined together to form a paragraph. The content of a paragraph would be wrapped in a `p`.

```
The first text block
has a *bolded* word.

The second text block
has an _italic_ word.
```

is translated to:

```
<p>The first text block has a <b>bolded</b> word.</p>
<p>The second text block has an <i>italic</i> word.</p>
```

This works in the indented body of a tag.

```
#tag1
  first paragraph of tag 1

  #tag2
    content of tag 2

  second paragraph of tag 1
```

is translated to:

```
<tag1>
  <p>first paragraph of tag 1</p>
  <tag2>
      <p>content of tag 2</p></tag2>
  <p>second paragraph of tag 1</p></tag1>
```

Note the difference between the following two tags:

```
#tag1 a line of content

#tag2
  a paragraph of content
```

In this case, tag1's content isn't wrapped in a `p`, but tag2's content is:

```
<tag1>a line of content</tag1>
<tag2><p>a paragraph of content</p></tag2>
```

## Tag Attributes

It's possible to specify tag attributes:

```
#tag[a=1 b=2 c=3]
  content of tag
```

is translated to:

```
<tag a="1" b="2" c="3">
  content of tag
</tag>
```

Tags can also be given non-key-value arguments that are collected into an array of strings:

```
#tag[a b c]
```

Key-value pairs and arguments can appear in any order:

```
#tag[a k1=1 b k2=2 c k3=3]
```

This tag is represented by the JSON object:

```
{name: "tag",
 opts: {
  "k1": "1",
  "k2": "2",
  "k3": "3"
 },
 args: ["a", "b", "c"]
}
```

Arguments are stripped away when translated to XML. They are only useful when you want to transform the AST. The above tag outputs this XML:

```
<tag k1="1" k2="2" k3="3"/>
```

Note: That attributes MUST be on the same line. The following is illegal:

```
#tag[
  a=1
  b=2
  c=3]
  bad tag. arguments must be on the same line.
```

# heredoc

We can use a tag argument to emulate how Github Flavored Markdown quotes a snippet of code.

```
#```[javascript]
  function foo() {
    console.log("foo");
  }
```

is translated to:

```
<pre><code lang="javascript">function foo() {
  console.log("foo");
}</code></pre>
```

xmd has builtin syntax for this purpose:

    ```[javascript]
    function foo() {
      console.log("foo");
    }
    ```

Aside from the language, you might also want to specify the theme:

    ```[javascript theme=dark]
    function foo() {
      console.log("foo");
    }
    ```

We can omit the tag arguments if we want to:

    ```
    function foo() {
      console.log("foo");
    }
    ```

We can use a heredoc to indicate the end of the snippet:

    ```HERE
    function foo() {
      console.log("foo");
    }
    ```HERE

Finally, to combine heredoc and tag argument:

    ```[javascript theme=dark]HERE
    function foo() {
      console.log("foo");
    }
    ```HERE

## Text Formatting

Text formatting looks as you'd expect:

```
A piece of *bolded text*.
Followed by some _italic text_.
Then it ends with a bit of `code`!
```

## Inline Tag

Aside from "*", "_" and "`", markdown has special syntax for links and images. Some dialects support footnotes. We want to be able to express all of these in a generic way.

While the `#tag` syntax is good to express structure, it is not so nice for inline text. It'd be tedious to write something like:

```
#a[href="http://google.com"]
  #b The
    #i Google
```

Borrowing markdown's link syntax, we can write an inline tag like this:

```
[tag a b c k1=1 k2=2 k3=3][*content* of tag]
```

which gets translated to:

```
<tag k1="1" k2="2" k3="3"><b>content</b> of tag</tag>
```

We can use the same inline tag syntax to express bold, italic, and code:

```
[*][bolded text]
[_][italic text]
[`][pieceOfCode]
```

We can nest inline tags:

```
A piece of [`][*bolded*[_][AndItalicCode]]
```

Which translates to:

```
A piece of <code><b>bolded</b><i>AndItalicCode</i></b></code>
```

### Link

We use the inline-tag syntax for links.

```
[> http://google.com][*The* Google]
```

Or omitting the content:

```
[> http://google.com]
```

### No Nesting for * _ `

It is not allowed to nesting the followings:

+  `_`
+ <code>`</code>
+ `*`

The rule for interpreting these is simple. The parser reads everything until it finds the matching special character.

```
*_bold_*
```

get translated to:

```
<b>_bold_</b>
```

If you really want italic bold, use inline-tag syntax:

```
[*][_italic bold_]
```

`*` and `_` can be terribly confusing when they are nested.

## Escape

The only special characters are:

+ `#`
+ `*`
+ `_`
+ <code>`</code>
+ `[` and `]`
+ `\`

The backslash is used for escaping. A character that follows `\` is interpreted as itself:

```
\# => #
\* => *
\\ => \
\a => a
\n => n
etc.
```

## Quotation

It should be easy to copy and paste an arbitrary chunk of text into the document without having to massage it into proper syntax.

Suppose we want to embed a LaTeX equation into the document;

```
E &= \frac{mc^2}{\sqrt{1-\frac{v^2}{c^2}}}
```

It'd be terribly tedious (and error prone) to escape it manually with backslashes:

```
#latex
  E &= \\frac{mc^2}{\\sqrt{1-\\frac{v^2}{c^2}}}
```

For this purpose, we use heredoc but with 4 backticks:

    #latex
      ````
      E &= \frac{mc^2}{\sqrt{1-\frac{v^2}{c^2}}}
      ````
It gets translated to:

```
<latex>E &= \frac{mc^2}{\sqrt{1-\frac{v^2}{c^2}}}</latex>
```

The inline quote uses 2 backticks. The same LaTeX equation written as an inline-tag;

```
[latex][``E &= \frac{mc^2}{\sqrt{1-\frac{v^2}{c^2}}}``]
```

# Parser & Transformers

The xmd format is pure syntax. When the parser sees `*bold*` it sees a tag whose name is `*`, whose content is "bold". The AST output is:

```
{
  name: "*",
  children: ["bold"]
}
```

How does `*` get translated to `b` before being output to XML? There is a transformer that walks the AST and replace each `*` with `b`. The xmd package provides a [default transformation](https://github.com/hayeah/xmd/blob/09a6bdee517e95bdb6219397667156c0f8bc9670/src/Xmd.ts#L43-L67):

```
"" => "h1"
"#" => "h2"
"##" => "h3"
etc.
"*" => "b"
"_" => "i"
"`" => "code"
"```" => "<pre><code>"
">" => a
```

You can implement your own AST transformer instead of using the default.



