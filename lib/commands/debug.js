/**
 *
 * This command helps you to debug your integration tests. It stops the running queue and gives
 * you time to jump into the browser and check the state of your application (e.g. using the
 * dev tools). Once you are done go to the command line and press Enter.
 * 
 * Make sure you increase the timeout property of your test framework your are using (e.g. Mocha
 * or Jasmine) in order to prevent the continuation due to a test timeout.
 *
 * <example>
    :debug.js
    client
        .setValue('#input', 'FOO')
        .debug() // jumping into the browser and change value of #input to 'BAR'
        .getValue('#input').then(function(value) {
            console.log(value); // outputs: "BAR"
        })
        .end();
 * </example>
 *
 * @type utility
 *
 */

var readline = require('readline'),
    Q = require('q');

module.exports = function debug () {

    var defer = Q.defer();
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    var logLevel = this.logger.logLevel;
    this.logger.logLevel = 'verbose';
    this.logger.debug();

    rl.question('', function() {
        this.logger.logLevel = logLevel;
        rl.close();
        defer.resolve();
    }.bind(this));

    return defer.promise;
};
