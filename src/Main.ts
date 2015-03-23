///<reference path="./index.d.ts" />
import minimist = require("minimist");
import fs = require("fs");

import xmd = require("./Xmd");

// xmd [--json | -j] [xmdfile]
export = main;

interface MainArgs extends minimist.ParsedArgs {
  // output in json format
  j?: boolean;
  json?: boolean;

  h?: boolean;
  help?: boolean;

  pretty?: boolean;

  // ast mode. output parsed ast in JSON with no transform
  ast?: boolean;
}

function help() {
  var helpdoc =
`
xmd [--json | --j] [xmdfile]

Renders extensible markdown to xml (defualt) or json.

  --ast           output parsed document in JSON
  -j, --json      output JSON
  -p, --pretty    pretty print the output
  -h, --help      show help
`
  console.log(helpdoc);
  process.exit(0);
}

function main() {
  var args = <MainArgs>minimist(process.argv.slice(2),{
    alias: {
      "h": ["help"],
      "j": ["json"],
      "p": ["pretty"]
    },
    boolean: ["ast","json","pretty"]
  });

  if(args.h || args.help) {
    help();
  }

  var srcInput: NodeJS.ReadableStream;
  if(args._.length == 0) {
    srcInput = process.stdin;
  } else {
    var path = args._[0];
    srcInput = fs.createReadStream(path,"utf8");
  }

  readInput(srcInput,(err,src) => {
    var output: string;
    var opts: any = {};
    if(args.pretty) {
      opts.indent = 4;
    }


    if(err) {
      console.log(err);
      process.exit(1);
    } else {
      if(args.json || args.ast) {
        opts.raw = !!args.ast;
        output = xmd.renderJSON(src,opts);
      } else {
        output = xmd.renderXML(src,opts);
      }
    }
    process.stdout.write(output);
  });
}

function readInput(stream:NodeJS.ReadableStream,cb: (err,src?:string) => void) {
  var src = "";
  stream.on("readable",() => {
    if(src != null) {
      src += stream.read();
    }
  });

  stream.on("error",(err) => {
    cb(err);
  });

  stream.on("end",() => {
    cb(null,src);
  });
}
