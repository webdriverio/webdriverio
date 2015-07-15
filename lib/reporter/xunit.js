/**
 * Module dependencies.
 */

var util = require('util'),
    Base = require('./base'),
    fs = require('fs'),
    path = require('path'),
    sanitizeCaps = require('../helpers/sanitize').caps;

/**
 * Initialize a new `XUnit` reporter.
 *
 * @param {Runner} runner
 * @api public
 */
function XUnit(options) {
    Base.call(this);

    var tests = this.tests = {},
        runnerData = this.runnerData = {},
        self = this,
        id = 0;

    this.errorLogCharacterLimitation = 10000;
    this.indents = 0;
    this.errors = 0;
    this.options = options;

    /**
     * remember which tests got executed by runner
     */
    this.on('runner:start', function(runner) {
        tests[runner.pid] = [{
            start: new Date(),
            tests: [],
            root: true,
            /**
             * problematic by setting end date when runner started:
             * `<testsuites />` time will include computation time of all before/after hooks, that
             * results in a bigger time value then all time values of its `<testsuite/>` summed
             * together
             */
            end: new Date(),
        }];

        runnerData[runner.pid] = {
            command: [],
            result: [],
            error: []
        };
    });

    this.on('runner:command', function(data) {
        runnerData[data.pid].command.push(data);
    });
    this.on('runner:result', function(data) {
        runnerData[data.pid].result.push(data);
    });
    this.on('runner:error', function(data) {
        self.errors++;
        runnerData[data.pid].error.push(data);
    });

    /**
     * clear runnerData cache
     */
    this.on('test:start', function(test) {
        runnerData[test.pid] = {
            command: [],
            result: [],
            error: []
        };
    });

    this.on('suite:start', function(suite){
        suite.id = ++id;
        suite.tests = [];
        suite.passes = 0;
        suite.pending = 0;
        suite.failures = 0;
        suite.timestamp = new Date();

        /**
         * root suites
         */
        if(suite.parent === '' || !suite.parent) {
            tests[suite.pid][0].tests.push(suite);
            return;
        }

        var parentSuite = this.findParentSuite(suite.parent, this.tests[suite.pid][0]);
        parentSuite.tests.push(suite);
    });

    this.on('test:pending', function(test) {
        var parentSuite = this.findParentSuite(test.parent, this.tests[test.pid][0]);
        parentSuite.pending++;
        test.id = ++id;
        test.time = new Date() - tests[test.pid][0].end,
        test.timestamp = tests[test.pid][0].end = new Date();
        test.runnerData = runnerData[test.pid];
        parentSuite.tests.push(test);
    });

    this.on('test:pass', function(test) {
        var parentSuite = this.findParentSuite(test.parent, this.tests[test.pid][0]);
        parentSuite.passes++;
        test.id = ++id;
        test.time = new Date() - tests[test.pid][0].end,
        test.timestamp = tests[test.pid][0].end = new Date();
        test.runnerData = runnerData[test.pid];
        parentSuite.tests.push(test);
    });

    this.on('test:fail', function(test) {
        var parentSuite = this.findParentSuite(test.parent, this.tests[test.pid][0]);
        parentSuite.failures++;
        test.id = ++id;
        test.time = new Date() - tests[test.pid][0].end,
        test.timestamp = tests[test.pid][0].end = new Date();
        test.runnerData = runnerData[test.pid];
        parentSuite.tests.push(test);
    });

    this.on('end', function() {
        Object.keys(tests).forEach(function(pid) {
            self.genTestsuites(tests[pid], pid);
        });
    });
}

/**
 * Inherit from Base
 */
util.inherits(XUnit, Base);

function escape(html){
  return String(html)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r?\n|\r/g, '');
}

XUnit.prototype.findParentSuite = function(title, suite) {
    var _suite = null;

    for(var i = 0; i < suite.tests.length; ++i) {
        if(suite.tests[i].title === title) {
            return suite.tests[i];
        }

        if(suite.tests[i].tests) {
            _suite = _suite || this.findParentSuite(title, suite.tests[i]);
        }
    }

    return _suite;
};

/**
 * generate junit report
 */
XUnit.prototype.genTestsuites = function(tests, pid) {

    var caps = this.stats.runner[pid].capabilities,
        options = this.options.reporterOptions,
        filename = 'WDIO.xunit.' + sanitizeCaps(caps) + '.' + pid + '.xml';

    if (options && typeof options.outputDir === 'string') {
        this.fileStream = fs.createWriteStream(path.join(process.cwd(), options.outputDir, filename));
    }

    /**
     * root testsuites tag
     */
    this.write(tag('testsuites', {
        name: sanitizeCaps(caps),
        tests: this.stats.tests,
        failures: this.stats.failures,
        errors: this.errors,
        disabled: this.stats.pending,
        time: this.stats.duration / 1000
    }));

    this.indents++;
    this.genTestsuite(tests[0].tests);
    this.indents--;

    this.write('</testsuites>');

    if (this.fileStream) {
        this.fileStream.end();
    }
};

function sumTime(suite) {
    var res = 0;

    for(var i = 0; i < suite.tests.length; ++i) {
        if(suite.tests[i].tests) {
            res += sumTime(suite.tests[i]);
        } else {
            res += suite.tests[i].time;
        }
    }

    return res;
}

XUnit.prototype.printLogTags = function(data, tagName, type, iter) {
    var content = '';

    for(var i = 0; i < data.length; ++i) {
        content += iter(data[i]);
    }

    if(content !== '') {
        content = cdata('\n' + content);
        this.indents++;
        this.write(tag(tagName, {
            type: type
        }, false, content));
        this.indents--;
    }
};

/**
 * generate testsuites markup
 */
XUnit.prototype.genTestsuite = function(tests) {

    var self = this;

    tests.forEach(function(test) {

        /**
         * write test suite
         */
        if(test.tests) {
            self.write(tag('testsuite', {
                name: test.title,
                tests: test.pending + test.passes + test.failures,
                failures: test.failures,
                // errors: test.failures,
                skipped: test.pending,
                disabled: test.pending,
                time: sumTime(test) / 1000,
                timestamp: test.timestamp,
                id: test.id,
                file: test.file
            }));

            self.indents++;
            self.genTestsuite(test.tests);
            self.indents--;

            self.write('</testsuite>');
            return;
        }

        /**
         * write testcase
         */
        self.write(tag('testcase', {
            name: test.title,
            disabled: test.pending,
            time: test.time / 1000,
            id: test.id,
            file: test.file,
            status: test.err ? 'failed' : 'passed',
            classname: sanitizeCaps(self.stats.runner[test.pid].capabilities)
        }));

        /**
         * print skipped tags
         */
        if(test.pending) {

            self.indents++;
            self.write(tag('skipped', {}, true));
            self.indents--;

            self.write('</testcase>');
            return;

        /**
         * print failure tags
         */
        } else if(test.err) {
            var content = cdata((test.err.stack || '').slice(0, self.errorLogCharacterLimitation));

            self.indents++;
            self.write(tag('failure', {
                type: 'testerror',
                message: escape(test.err.message)
            }, false, content));
            self.indents--;

        }

        /**
         * print runner logs
         */
        self.printLogTags(test.runnerData.command, 'system-out', 'command', function(data) {
            return data.method.toUpperCase() + ' ' + data.uri.href + ' - ' + JSON.stringify(data.data) + '\n';
        });
        self.printLogTags(test.runnerData.result, 'system-out', 'result', function(data) {
            return (data.requestOptions.method || 'get').toUpperCase() + ' ' + data.requestOptions.uri.href + ' - ' + JSON.stringify(data.body).slice(0, self.errorLogCharacterLimitation) + '\n';
        });
        self.printLogTags(test.runnerData.error, 'system-err', 'runnererror', function(data) {
            var ret = '';

            if(data.requestOptions) {
                ret += (data.requestOptions.method || 'get').toUpperCase() + ' ' + data.requestOptions.uri.href + '\n';
            }

            ret += 'ERROR:' + data.err + '\n';

            if(data.body) {
                ret += 'BODY:' + (typeof data.body === 'object' ? JSON.stringify(data.body) : data.body).slice(0, self.errorLogCharacterLimitation) + '\n';
            }

            return ret;
        });

        self.write('</testcase>');
    });


};

/**
 * Write out the given line
 */
XUnit.prototype.write = function(line) {
    var indent = Array(this.indents * 2).join('  ');
    if (this.fileStream) {
        this.fileStream.write(indent + line + '\n');
    } else {
        console.log(indent + line);
    }
};

/**
 * HTML tag helper.
 */
function tag(name, attrs, close, content) {
    var end = close ? '/>' : '>',
        pairs = [],
        _tag;

    for (var key in attrs) {
        pairs.push(key + '="' + escape(attrs[key]) + '"');
    }

    _tag = '<' + name + (pairs.length ? ' ' + pairs.join(' ') : '') + end;
    if (content) _tag += content + '</' + name + end;
    return _tag;
}

/**
 * Return cdata escaped CDATA `str`.
 */

function cdata(str) {
    return '<![CDATA[' + str + ']]>';
}

/**
 * Expose `XUnit`.
 */
exports = module.exports = XUnit;