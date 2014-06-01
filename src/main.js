/*global exports, process, require */

(function (exports) {
    "use strict";

    /**
     * A function to parse the command line args for a transpiler.
     * Command line args comprise the following:
     *  sourceFileMappings  an array of two element arrays of the source file locations
     *  target              the target folder to write output to
     *  options             A JSON object with options to be passed on to the transpiler.
     * Source file mappings are a tuple of the full path to a source file and its relative
     * path within that e.g. ["/home/huntc/a.js", "a.js"]. Absolute/relative paths are 
     * useful in various contexts.
     * If a source file mapping is passed in as just one string arg then a path mapping
     * will be constructed relative to the current working directory and the source file is
     * expected to be relative to that.
     * If no target is specifed then a "lib" folder relative to the current working directory
     * will be assumed.
     * If no options are provided then an empty object is assumed.
     */
    exports.args = function (args) {

        var path = require("path");

        var SOURCE_FILE_MAPPINGS_ARG = 2;
        var TARGET_ARG = 3;
        var OPTIONS_ARG = 4;

        var cwd = process.cwd();

        var sourceFileMappings;
        try {
            sourceFileMappings = JSON.parse(args[SOURCE_FILE_MAPPINGS_ARG]);
        } catch (e) {
            sourceFileMappings = [
                path.join(cwd, args[SOURCE_FILE_MAPPINGS_ARG]), 
                args[SOURCE_FILE_MAPPINGS_ARG]
                ];
        }

        var target;
        if (args.length > TARGET_ARG) {
            target = args[TARGET_ARG];
        } else {
            target = path.join(cwd, "lib");
        }

        var options;
        if (args.length > OPTIONS_ARG) {
            options = JSON.parse(args[OPTIONS_ARG]);
        } else {
            options = {};
        }

        return {
            sourceFileMappings: sourceFileMappings,
            target: target,
            options: options
        };
    };

    exports.processingDone = function (sourcesToProcess, results, problems) {
        if (--sourcesToProcess === 0) {
            console.log("\u0010" + JSON.stringify({results: results, problems: problems}));
        }
        return sourcesToProcess;
    };

    /**
     * A processor that reads the files passed in and then writes them back out.
     * Config is an object with the following properties:
     *  inExt           A function to return the file extension of source files.
     *  outExt          A function to return the file extension of the output files.
     *  processor       A function to process each source as a string producing a string output or a problem descriptor.
     *  processingDone  A function that will be automatically called at the end of processing a source file.
     * At a minimum, inExt and processor need to be specified.
     * Args is as returned by our exports.args function.
     */
    exports.process = function (config, args) {

        config.outExt = config.outExt || ".js";
        config.processingDone = config.processingDone || exports.processingDone;

        var path = require("path"),
            when = require("when");

        var sourcesToProcess = args.sourceFileMappings.length;
        var results = [];
        var problems = [];

        function throwIfErr(e) {
            if (e) throw e;
        }

        args.sourceFileMappings.forEach(function (sourceFileMapping) {

            var input = sourceFileMapping[0];
            var outputFile = sourceFileMapping[1].replace(config.inExt, config.outExt);
            var output = path.join(args.target, outputFile);

            config.processor(input, output).then(function(result) {
                if (result.message) {
                    problems.push(result);
                    results.push({
                        source: input,
                        result: null
                    });
                } else {
                    results.push({
                        source: input,
                        result: {
                            filesRead: [input],
                            filesWritten: [output]
                        }
                    });
                }
                sourcesToProcess = config.processingDone(sourcesToProcess, results, problems);

            }).catch(function(e) {
                --sourcesToProcess;
                console.error(e);
            });
        });
    };
}(exports));