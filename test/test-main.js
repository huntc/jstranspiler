var assert = require("assert"),
    fs = require("fs"),
    jst = require("../src/main"),
    mkdirp = require("mkdirp"),
    path = require("path"),
    nodefn = require("when/node");

describe("jstranspiler", function () {
  describe("Invoking args", function(){
    it("should assume the current working dir and empty options", function () {
      var cwd = process.cwd();
      var source = path.join("src", "a.js");
      var args = jst.args(["node", "something", source]);
      assert.deepEqual({
        sourceFileMappings: [[path.join(cwd , source), source]],
        target: path.join(cwd, "/lib"),
        options: {}
      }, args);
    });

    it("should assume the current working dir and specified options", function () {
      var cwd = process.cwd();
      var source = path.join("src", "a.js");
      var options = '{"someoption": "someoptionvalue"}';
      var args = jst.args(["node", "something", source, options]);
      assert.deepEqual({
        sourceFileMappings: [[path.join(cwd , source), source]],
        target: path.join(cwd, "/lib"),
        options: {
          someoption: "someoptionvalue"
        }
      }, args);
    });

    it("should assume the specified dir with specified options", function () {
      var source = path.join(__dirname, "a.js");
      var sourceMappings = [[path.join(__dirname , source), source]];
      var target = path.join(__dirname, "/customlib");
      var options = {someOption: "someOptionValue"};
      var args = jst.args([
        "node", 
        "something", 
        JSON.stringify(sourceMappings), 
        target,
        JSON.stringify(options)
        ]);
      assert.deepEqual({
        sourceFileMappings: sourceMappings,
        target: target,
        options: options
      }, args);
    });
  });

  describe("Invoking transpiler", function(){
    var cwd = process.cwd();
    var source = path.join("test", "some.txt");
    var absSource = path.join(cwd , source);
    var sourceMappings = [[absSource, source]];
    var target = path.join(cwd, "/test-target");
    var absTarget = path.join(target, "test", "some.js");

    var maybe = {
        mkdirp: nodefn.lift(mkdirp),
        readFile: nodefn.lift(fs.readFile),
        writeFile: nodefn.lift(fs.writeFile)
      };

    function withProcessing(processor, processingDone) {
      var args = jst.args([
        "node", 
        "something", 
        JSON.stringify(sourceMappings), 
        target
        ]);

      jst.process({
        processor: processor, 
        processingDone: processingDone,
        inExt: ".txt"
      }, args);
    }

    it("should read the input, write the output and log the result", function (done) {
      function processor(input, output) {
        return maybe.readFile(input, "utf8").then(function(contents) {
            return maybe.mkdirp(path.dirname(output)).then(function() {
              return contents;
            });
          }).then(function(contents) {
            return maybe.writeFile(output, contents, "utf8");
          }).then(function() {
            return {
              source: input,
              result: {
                  filesRead: [input],
                  filesWritten: [output]
              }
            };
          });
      }

      function processingDone(sourcesToProcess, results, problems) {
        if (--sourcesToProcess === 0) {
          assert.deepEqual([
            {
              source: absSource,
              result: {
                filesRead: [absSource],
                filesWritten: [absTarget]
              }
          }], results);

          assert.deepEqual([], problems);

          done();
        }
        return sourcesToProcess;
      }

      withProcessing(processor, processingDone);

    });

    it("should read the input and log a problem", function (done) {
      function processor(input, output) {
        return maybe.readFile(input, "utf8").then(function(contents) {
          return {
              message: "Whoops",
              severity: "error",
              lineNumber: 10,
              characterOffset: 5,
              lineContent: "Fictitious problem",
              source: input
          };
        });
      }

      function processingDone(sourcesToProcess, results, problems) {
        if (--sourcesToProcess === 0) {
          assert.deepEqual([{
              source: absSource,
              result: null
            }], results);

          assert.deepEqual([{
              message: "Whoops",
              severity: "error",
              lineNumber: 10,
              characterOffset: 5,
              lineContent: "Fictitious problem",
              source: absSource
          }], problems);

          done();
        }
        return sourcesToProcess;
      }

      withProcessing(processor, processingDone);

    });

  });
});
