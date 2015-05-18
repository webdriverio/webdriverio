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
Spec.prototype.gotExecutedByAllRunner = function(latestPid) {
    return this.gotExecutedBy(latestPid) === Object.keys(this.stats.runner).length;
};

/**
 * returns number of how many runners have executed the test
 */
Spec.prototype.gotExecutedBy = function(latestPid) {
    var pos = this.testsBy[latestPid].length - 1,
        gotExecutedBy = 0,
        pids = Object.keys(this.testsBy);

    for(var i = 0; i < pids.length; ++i) {
        /**
         * only increase variable if runner has executed the tes
         */
        !!this.testsBy[pids[i]][pos] && gotExecutedBy++;
    }

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
        inSpinState = 0;

    if(this.spinner) {
        return;
    }

    this.spinner = setInterval(function() {
        this.cursor.beginningOfLine();

        if(color !== 'suite') {
            util.print('  ');
            /**
             * need util.print here as it prints with right encoding
             */
            util.print(this.color('medium', spinStates[inSpinState % 4]) + ' ');
        }

        process.stdout.write(this.color(color, test.title));

        if(color !== 'suite') {
            process.stdout.write(this.color('medium', ' (' + this.gotExecutedBy(test.pid) + '/' + Object.keys(this.stats.runner).length) + ')');
        }

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