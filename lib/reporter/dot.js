/**
 * Module dependencies.
 */
var util = require('util'),
    Base = require('./base');

/**
 * Initialize a new `Dot` matrix test reporter.
 *
 * @param {Runner} runner
 * @api public
 */
var Dot = function Dot() {
    Base.call(this);

    this.on('start', function(){
        console.log();
    });

    this.on('test:pending', function() {
        this.printDots('pending');
    });

    this.on('test:pass', function() {
        this.printDots('green');
    });

    this.on('test:fail', function() {
        this.printDots('fail');
    });

    this.on('test:end', function() {
        this.printDots(null);
    });

    this.on('end', function() {
        this.epilogue();
        console.log();
    });
};

/**
 * Inherit from Base
 */
util.inherits(Dot, Base);

Dot.prototype.printDots = function(color) {
    var self = this,
        tests = null,
        minExecutedTests = null;

    Object.keys(this.stats.runner).forEach(function(pid) {
        var runner = self.stats.runner[pid];
        tests = Math.max(tests || runner.tests.length, runner.tests.length);
        minExecutedTests = Math.min(minExecutedTests || runner.tests.length, runner.tests.length);
    });

    function checkIfTestHasPassed(i) {
        var hasPassed = true;
        Object.keys(self.stats.runner).forEach(function(pid) {
            var runner = self.stats.runner[pid];

            if(i > runner.tests.length - 1) {
                return;
            }

            hasPassed = hasPassed && runner.tests[i] === null;
        });
        return hasPassed;
    }

    /**
     * no fancy spinner without tty
     */
    if(!this.cursor.isatty) {
        this.spinner = true;
        color && process.stdout.write(this.color(color, this.symbols.dot));
        return;
    }

    this.cursor.beginningOfLine();
    for(var i = 0; i < tests; ++i) {
        var hasTestPassed = checkIfTestHasPassed(i);

        if(minExecutedTests <= i) {
            process.stdout.write(this.color(hasTestPassed ? 'medium' : 'fail', this.symbols.dot));
        } else {
            process.stdout.write(this.color(hasTestPassed ? 'green' : 'fail', this.symbols.dot));
        }
    }
};

/**
 * Expose Dot
 */
exports = module.exports = Dot;