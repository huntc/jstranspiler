var assert = require("assert"),
	fs = require("fs"),
    jst = require("../src/main"),
	mkdirp = require("mkdirp"),
	path = require("path"),
	nodefn = require("when/node");

describe("jstranspiler", function () {
  	describe("Invoking with one file arg", function(){
    	it("should assume the current working dir and empty options", function () {
	        var cwd = process.cwd();
    		var source = path.join("src", "a.js");
	    	var args = jst.args(["node", "something", source]);
	      	assert.deepEqual({
	      		sourceFileMappings: [path.join(cwd , source), source],
	      		target: path.join(cwd, "/lib"),
	      		options: {}
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

    	it("should read the input, write the output and log the result", function (done) {
	        var cwd = process.cwd();
    		var source = path.join("test", "some.txt");
    		var absSource = path.join(cwd , source);
    		var sourceMappings = [[absSource, source]];
    		var target = path.join(cwd, "/test-target");
    		var absTarget = path.join(target, "test", "some.js");

	    	var args = jst.args([
	    		"node", 
	    		"something", 
	    		JSON.stringify(sourceMappings), 
	    		target
	    		]);

	    	var maybe = {
				mkdirp: nodefn.lift(mkdirp),
	    		readFile: nodefn.lift(fs.readFile),
	    		writeFile: nodefn.lift(fs.writeFile)
	    	};
	    	function processor(input, output, result, problem) {
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

	    	jst.process({
	    		processor: processor, 
	    		processingDone: processingDone,
	    		inExt: ".txt"
	    	}, args);

	    });

		// FIXME: More tests - test the problem result at least.
  	});
});
