/**
 *
 * This command helps you to debug your integration tests. It stops the running queue and gives
 * you time to jump into the browser and check the state of your application (e.g. using the
 * dev tools). Once you are done go to the command line and press Enter.
 *
 * <example>
    :debugger.js
    client
        .setValue('#input', 'FOO')
        .debugger() // jumping into the browser and change value of #input to 'BAR'
        .getValue('#input', function(err, value) {
            console.log(value); // outputs: "BAR"
        })
        .end();
 * </example>
 *
 * @type utility
 *
 */

var readline = require('readline');

module.exports = function debug (callback) {

    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    var logLevel = this.options.logLevel;
    this.logger.logLevel = 'verbose';
    this.logger.debug();

    rl.question('', function(answer) {
        this.logger.logLevel = logLevel;
        rl.close();
        callback();
    }.bind(this));

};
