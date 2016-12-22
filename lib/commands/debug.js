/**
 *
 * This command helps you to debug your integration tests. It stops the running browser and gives
 * you time to jump into it and check the state of your application (e.g. using the dev tools).
 * Your terminal transforms into a [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop)
 * interface that will allow you to try out certain commands, find elements and test actions on
 * them.
 *
 * [![WebdriverIO REPL](http://webdriver.io/images/repl.gif)](http://webdriver.io/images/repl.gif)
 *
 * If you run the WDIO testrunner make sure you increase the timeout property of your test framework
 * your are using (e.g. Mocha or Jasmine) in order to prevent the continuation due to a test timeout.
 * Also avoid to execute the command with multiple capabilities running at the same time.
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
import { RuntimeError } from '../utils/ErrorHandler'

let debug = function (commandTimeout = 5000, enableStdout, enableLogging) {
    let commandIsRunning = false
    let logLevel = this.logger.logLevel
    this.logger.logLevel = 'verbose'
    this.logger.debug()

    if (!enableLogging) {
        this.logger.logLevel = logLevel
    }

    const myEval = (cmd, context, filename, callback) => {
        if (commandIsRunning) {
            return
        }

        if (cmd === 'browser\n') {
            return callback(null, '[WebdriverIO REPL client]')
        }

        commandIsRunning = true
        let result
        if (typeof global.wdioSync === 'function') {
            return global.wdioSync(() => {
                try {
                    result = vm.runInThisContext(cmd)
                } catch (e) {
                    commandIsRunning = false
                    return callback(e)
                }

                callback(null, result)
                commandIsRunning = false
            })()
        }

        context.browser = this
        try {
            result = vm.runInThisContext(cmd)
        } catch (e) {
            commandIsRunning = false
            return callback(e)
        }

        if (!result || typeof result.then !== 'function') {
            commandIsRunning = false
            return callback(null, result)
        }

        const timeout = setTimeout(() => callback(new RuntimeError('Command execution timed out')), commandTimeout)
        result.then((res) => {
            commandIsRunning = false
            clearTimeout(timeout)
            return callback(null, res)
        }, (e) => {
            commandIsRunning = false
            clearTimeout(timeout)
            return callback(e)
        })
    }

    const replServer = repl.start({
        prompt: '> ',
        eval: myEval,
        input: process.stdin,
        output: process.stdout,
        useGlobal: true,
        ignoreUndefined: true
    })

    return new Promise((resolve) => {
        replServer.on('exit', () => {
            this.logger.logLevel = logLevel
            resolve()
        })
    })
}

export default debug
