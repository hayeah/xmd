
```
<doc> := <space>* <content(0)> <space>*
```

```
<content(n)> :=
    <tag(n)> |
    <text-block(n)> |
    <code-heredoc(n)> |
    <string-heredoc(n)> |
    <empty-line>
```

```
<tag(n)> := <indent(n)> "#" <symbol> <tag-arguments>? <tag-inline-body>? <nl>
    <content(n+2)>?
<tag-inline-body> := <text-line>
<tag-arguments> := "[" <arguments> "]"
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