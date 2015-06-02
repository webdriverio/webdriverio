/**
 * Module dependencies.
 */
var util = require('util'),
    Base = require('./base');

/**
 * Initialize a new `Spec` matrix test reporter.
 *
 * @param {Runner} runner
 * @api public
 */
var Spec = function Spec() {
    Base.call(this);

    var cntError = 0;

    this.testsBy = {};
    this.indents = 0;

    this.on('start', function(){
        console.log();
    });

    /**
     * remember which tests got executed by runner
     */
    this.on('runner:start', function(runner) {
        this.testsBy[runner.pid] = [];
    });

    this.on('suite:start', function(suite){
        /**
         * mark state for runner as "reached"
         */
        this.testsBy[suite.pid].push(true);

        /**
         * only continue if all runner have reached that state
         * otherwise show spinner ascii gimmick
         */
        if(!this.gotExecutedByAllRunner(suite.pid)) {
            return this.runSpinner(suite, 'suite');
        }

        ++this.indents;
        this.clearSpinner();
        console.log(this.color('suite', '%s%s'), this.indent(), suite.title);
    });

    this.on('suite:end', function(suite){
        /**
         * mark state for runner as "reached"
         */
        this.testsBy[suite.pid].push(true);

        /**
         * only continue if all runner have reached that state
         */
        if(!this.gotExecutedByAllRunner(suite.pid)) {
            return;
        }

        --this.indents;
        if(1 === this.indents) {
            console.log();
        }
    });

    this.on('test:start', function(test) {
        if(this.spinner) {
            return;
        }
        this.runSpinner(test, 'pass');
    });

    this.on('test:pending', function(test) {
        /**
         * mark state for runner as "reached"
         */
        this.testsBy[test.pid].push(true);

        /**
         * only continue if all runner have reached that state
         * otherwise show spinner ascii gimmick
         */
        if(!this.gotExecutedByAllRunner(test.pid)) {
            return;
        }
        var fmt = this.indent() + this.color('pending', '  - %s');
        this.clearSpinner();
        this.cursor.CR();
        console.log(fmt, test.title);
    });

    this.on('test:pass', function(test) {
        /**
         * mark state for runner as "reached"
         */
        this.testsBy[test.pid].push(true);

        /**
         * only continue if all runner have reached that state
         */
        if(!this.gotExecutedByAllRunner(test.pid)) {
            return;
        }

        var fmt = this.indent() +
                  this.color('checkmark', '  ' + this.symbols.ok) +
                  this.color('pass', ' %s') +
                  this.color('medium', ' (%dms)');

        this.clearSpinner();
        this.cursor.CR();
        console.log(fmt, test.title, test.duration);
    });

    this.on('test:fail', function(test) {
        /**
         * mark state for runner as "reached"
         */
        this.testsBy[test.pid].push(true);

        /**
         * only continue if all runner have reached that state
         */
        if(!this.gotExecutedByAllRunner(test.pid)) {
            return;
        }

        this.clearSpinner();
        this.cursor.CR();
        console.log(this.indent() + this.color('fail', '  %d) %s'), ++cntError, test.title);
    });

    this.on('end', function() {
        this.clearSpinner();
        this.epilogue();
        console.log();
    });
};

/**
 * Inherit from Base
 */
util.inherits(Spec, Base);

/**
 * returns true if test got executed by all runner
 */
Spec.prototype.gotExecutedByAllRunner = function(pid) {
    /**
     * always true when there is only one runner
     */
    if(Object.keys(this.testsBy).length === 1) {
        return true;
    }

    var pos = this.testsBy[pid].length - 1;
    return this.gotExecutedBy(pos) === Object.keys(this.stats.runner).length;
};

/**
 * returns number of how many runners have executed the test
 */
Spec.prototype.gotExecutedBy = function(pos) {
    var self = this,
        gotExecutedBy = 0;

    Object.keys(this.testsBy).forEach(function(pid) {
        /**
         * only increase variable if runner has executed the tes
         */
        !!self.testsBy[pid][pos] && gotExecutedBy++;
    });

    return gotExecutedBy;
};

Spec.prototype.indent = function() {
    return Array(this.indents).join('  ');
};

/**
 * starts little ascii spinner gimick
 */
Spec.prototype.runSpinner = function(test, color) {
    var spinStates = ['◴','◷','◶','◵'],
        testsBy = this.testsBy,
        inSpinState = 0;

    /**
     * no need for a spinner if one is already spinning or if we only have one runner
     */
    if(this.spinner || Object.keys(this.testsBy).length === 1) {
        return;
    }

    /**
     * no fancy spinner without tty
     */
    if(!this.cursor.isatty) {
        this.spinner = true;
        return;
    }

    this.spinner = setInterval(function() {
        this.cursor.beginningOfLine();

        /**
         * no special spinner for suite label
         */
        if(color === 'suite') {
            return process.stdout.write(this.color(color, test.title));
        }

        /**
         * get position of slowest runner
         */
        var pos = null;
        Object.keys(testsBy).forEach(function(pid) {
            if(pos === null) {
                pos = testsBy[pid].length;
            }
            pos = Math.min(pos, testsBy[pid].length);
        });

        /**
         * need util.print here as it prints with right encoding
         */
        process.stdout.write('  ' + this.color('medium', spinStates[inSpinState % 4]) + ' ' + this.color(color, test.title));
        process.stdout.write(this.color('medium', ' (' + this.gotExecutedBy(pos) + '/' + Object.keys(this.stats.runner).length) + ')');

        inSpinState++;
    }.bind(this), 100);
};

/**
 * remove and clear spinner
 */
Spec.prototype.clearSpinner = function() {
    clearInterval(this.spinner);
    delete this.spinner;
    this.cursor.deleteLine();
    this.cursor.beginningOfLine();
};

/**
 * Expose Spec
 */
exports = module.exports = Spec;