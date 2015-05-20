/**
 * Module dependencies.
 */

var util = require('util'),
    Base = require('./base'),
    fs = require('fs');

/**
 * Initialize a new `XUnit` reporter.
 *
 * @param {Runner} runner
 * @api public
 */
function XUnit() {
    Base.call(this);

    var tests = this.tests = {},
        self = this,
        id = 0;

    this.indents = 0;

    /**
     * remember which tests got executed by runner
     */
    this.on('runner:start', function(runner) {
        tests[runner.pid] = [{
            tests: [],
            root: true
        }];
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
        test.timestamp = new Date();
        parentSuite.tests.push(test);
    });

    this.on('test:pass', function(test) {
        var parentSuite = this.findParentSuite(test.parent, this.tests[test.pid][0]);
        parentSuite.passes++;
        test.id = ++id;
        test.timestamp = new Date();
        parentSuite.tests.push(test);
    });

    this.on('test:fail', function(test) {
        var parentSuite = this.findParentSuite(test.parent, this.tests[test.pid][0]);
        parentSuite.failures++;
        test.id = ++id;
        test.timestamp = new Date();
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

function sanitize(str) {

    if(!str) return '';

    return String(str)
        .replace(/\./, '_')
        .replace(/\s/, '')
        .toLowerCase();
}

function sanitizeCaps(caps) {
    /**
     * mobile caps
     */
    if(caps.deviceName) {
        return sanitize(caps.deviceName) +
               sanitize(caps.platformName) +
               sanitize(caps.platformVersion);
    }

    return sanitize(caps.browserName) +
           sanitize(caps.platform) +
           sanitize(caps.version);
}

function escape(html){
  return String(html)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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

    var self = this,
        caps = this.stats.runner[pid].capabilities,
        filename = 'WDIO.xunit.' + sanitizeCaps(caps) + '.' + pid + '.xml';

    /**
     * root testsuites tag
     */
    this.write(tag('testsuites', {
        name: sanitizeCaps(caps),
        tests: this.stats.tests,
        failures: this.stats.failures,
        // errors: this.stats.failures,
        disabled: this.stats.pending,
        time: (this.stats.duration / 1000) || 0
    }));

    self.indents++;
    self.genTestsuite(tests[0].tests);
    self.indents--;

    this.write('</testsuites>');

    /**
     * ToDo save file
     */
    // console.log(filename);
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
                time: test.timestamp,
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
            time: test.timestamp,
            id: test.id,
            file: test.file,
            status: test.err ? 'failed' : 'passed'
        }, test.pending || test.err));

        if(test.pending) {

            self.indents++;
            self.write(tag('skipped', {}, true));
            self.indents--;

            self.write('</testcase>');

        } else if(test.err) {
            var content = cdata(test.err.stack);

            self.indents++;
            self.write(tag('failure', {
                type: 'error',
                message: escape(test.err.message)
            }, true, content));
            self.indents--;

            self.write('</testcase>');
        }
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
    return '<![CDATA[' + escape(str) + ']]>';
}

/**
 * Expose `XUnit`.
 */
exports = module.exports = XUnit;