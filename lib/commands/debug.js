/**
 *
 * This command helps you to debug your integration tests. It stops the running queue and gives
 * you time to jump into the browser and check the state of your application (e.g. using the
 * dev tools). Once you are done go to the command line and press Enter.
 *
 * Make sure you increase the timeout property of your test framework your are using (e.g. Mocha
 * or Jasmine) in order to prevent the continuation due to a test timeout.
 *
 * <iframe width="560" height="315" src="https://www.youtube.com/embed/xWwP-3B_YyE" frameborder="0" allowfullscreen></iframe>
 *
 * <example>
    :debugAsync.js
    client
        .setValue('#input', 'FOO')
        .debug() // jumping into the browser and change value of #input to 'BAR'
        .getValue('#input').then(function(value) {
            console.log(value); // outputs: "BAR"
        });

    :debugSync.js
    it('should demonstrate the debug command', function () {
        browser
            .setValue('#input', 'FOO')
            .debug() // jumping into the browser and change value of #input to 'BAR'

        var value = browser.getValue('#input');
        console.log(value); // outputs: "BAR"
    });
 * </example>
 *
 * @alias browser.debug
 * @type utility
 *
 */

import readline from 'readline'

let debug = function () {
    const RL = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    let logLevel = this.logger.logLevel
    this.logger.logLevel = 'verbose'
    this.logger.debug()

    return new Promise((resolve) => {
        RL.question('', () => {
            this.logger.logLevel = logLevel
            RL.close()
            resolve()
        })
    })
}

export default debug
