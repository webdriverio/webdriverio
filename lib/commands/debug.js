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
    :debug.js
    it('should demonstrate the debug command', function () {
        browser.setValue('#input', 'FOO')

        browser.debug() // jumping into the browser and change value of #input to 'BAR'

        var value = browser.getValue('#input')
        console.log(value) // outputs: "BAR"
    })
 * </example>
 *
 * @alias browser.debug
 * @type utility
 *
 */

import vm from 'vm'
import repl from 'repl'

let debug = function (enableStdout, enableLogging) {
    let commandIsRunning = false
    let logLevel = this.logger.logLevel
    this.logger.logLevel = 'verbose'
    this.logger.debug()

    if (!enableLogging) {
        this.logger.logLevel = logLevel
    }

    const replServer = repl.start({
        prompt: '> ',
        eval: myEval,
        input: process.stdin,
        output: process.stdout,
        useGlobal: true,
        ignoreUndefined: true
    })

    function myEval (cmd, context, filename, callback) {
        if (commandIsRunning) {
            return
        }

        commandIsRunning = true
        global.wdioSync(() => {
            vm.runInThisContext(`global._result = (function () { return ${cmd} }).apply(this)`)
            callback(null, global._result)
            commandIsRunning = false
        })()
    }

    return new Promise((resolve) => {
        replServer.on('exit', () => {
            this.logger.logLevel = logLevel
            resolve()
        })
    })
}

export default debug
