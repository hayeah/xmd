
```
<doc> := <space>* <content(0)> <space>*
```

```
<content(n)> :=
    <tag(n)> |
    <list(n)> |
    <text-block(n)> |
    <code-heredoc(n)> |
    <string-heredoc(n)> |
    <empty-line>
```

```
<tag(n)> := <indent(n)> "#" <tag-def>
<tag-def> := <symbol> <tag-arguments>? <tag-inline-body>? <nl>
    <content(n+2)>?
<tag-inline-body> := <text-line>
<tag-arguments> := "[" <arguments> "]"
```

A list item ends with anything that's not a list item. The items may not have empty lines between them. The `?!` notation means "it's not a list item", and it's a non-consuming look-ahead.

```
<list(n)> := (<list-item(n)> | <empty-line>)+ ?!<list-item(n)>
<list-item(n)> := <indent(n)> "+" <tag-def>
```

```
<text-line> :=
```

```
<text-block(n)> :=
    <empty-line> |
    <indent(n)> <text-line> <nl> <text-block(n)>
```

```
<arguments> := (" "* (<argument> | <argument-kv>) " "*)*
<argument> := <symbol>
<argument-kv> := <symbol>=<symbol>
```

```
<symbol> := <quoted-string> | <unquoted-string>
<quoted-string> := <json-string>
<unquoted-string> := not('[' ']' '"' <space> "=")+
```

```
<code-heredoc(n)> :=
  <indent(n)> "```" <tag-arguments>? <symbol>? <nl>
  <indent(n)> <heredoc-content>
  <indent(n)> "```" <symbol>? <nl>

<string-heredoc(n)> :=
  <indent(n)> "````" <tag-arguments>? <symbol>? <nl>
  <indent(n)> <heredoc-content>
  <indent(n)> "````" <symbol>? <nl>

```