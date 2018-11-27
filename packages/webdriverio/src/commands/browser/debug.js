
/**
 *
 * This command helps you to debug your integration tests. It stops the running browser and gives
 * you time to jump into it and check the state of your application (e.g. using dev tools).
 * Your terminal transforms into a [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop)
 * interface that will allow you to try out certain commands, find elements and test actions on
 * them.
 *
 * [![WebdriverIO REPL](http://webdriver.io/images/repl.gif)](http://webdriver.io/images/repl.gif)
 *
 * If you run the WDIO testrunner make sure you increase the timeout property of the test framework
 * you are using (e.g. Mocha or Jasmine) in order to prevent test termination due to a test timeout.
 * Also avoid executing the command with multiple capabilities running at the same time.
 *
 * <iframe width="560" height="315" src="https://www.youtube.com/embed/xWwP-3B_YyE" frameborder="0" allowfullscreen></iframe>
 *
 * <example>
    :debug.js
    it('should demonstrate the debug command', () => {
        $('#input').setValue('FOO')
        browser.debug() // jumping into the browser and change value of #input to 'BAR'
        const value = $('#input').getValue()
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

import { runFnInFiberContext, hasWdioSyncSupport } from '@wdio/config'

export default function debug(commandTimeout = 5000) {
    process.send({
        origin: 'runner',
        name: 'debug',
        event: 'start'
    })
    let commandIsRunning = false

    /* istanbul ignore next */
    const myEval = (cmd, context, filename, callback) => {
        if (commandIsRunning) {
            return
        }

        if (cmd === 'browser\n') {
            return callback(null, '[WebdriverIO REPL client]')
        }

        context.browser = this
        commandIsRunning = true
        let result
        if (hasWdioSyncSupport) {
            return runFnInFiberContext(() => {
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

        const timeout = setTimeout(() => callback(new Error('Command execution timed out')), commandTimeout)
        result.then((res) => {
            commandIsRunning = false
            clearTimeout(timeout)
            return callback(null, res)
        }, (e) => {
            commandIsRunning = false
            clearTimeout(timeout)
            const commandError = new Error(e.message)
            delete commandError.stack
            return callback(commandError)
        })
    }

    const replServer = repl.start({
        prompt: '> ',
        eval: myEval,
        input: process.stdin,
        output: process.stdout,
        useGlobal: true,
        useColors: true,
        ignoreUndefined: true
    })

    return new Promise((resolve) => replServer.on('exit', () => {
        process.send({
            origin: 'runner',
            name: 'debug',
            event: 'end'
        })
        resolve()
    }))
}
