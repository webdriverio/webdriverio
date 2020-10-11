
/**
 *
 * This command helps you to debug your integration tests. It stops the running browser and gives
 * you time to jump into it and check the state of your application (e.g. using dev tools).
 * Your terminal transforms into a [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop)
 * interface that will allow you to try out certain commands, find elements and test actions on
 * them.
 *
 * [![WebdriverIO REPL](https://webdriver.io/img/repl.gif)](https://webdriver.io/img/repl.gif)
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

import { serializeError } from 'serialize-error'
import WDIORepl from '@wdio/repl'

export default function debug(commandTimeout = 5000) {
    const repl = new WDIORepl()
    const { introMessage } = WDIORepl

    /**
     * run repl in standalone mode
     */
    if (!process.env.WDIO_WORKER) {
        // eslint-disable-next-line
        console.log(WDIORepl.introMessage)
        const context = {
            browser: this,
            driver: this,
            $: this.$.bind(this),
            $$: this.$$.bind(this)
        }
        return repl.start(context)
    }

    /**
     * register worker process as debugger target
     */
    process._debugProcess(process.pid)

    /**
     * initialise repl in testrunner
     */
    process.send({
        origin: 'debugger',
        name: 'start',
        params: { commandTimeout, introMessage }
    })

    let commandResolve = /* istanbul ignore next */ () => { }
    process.on('message', (m) => {
        if (m.origin !== 'debugger') {
            return
        }

        if (m.name === 'stop') {
            process._debugEnd(process.pid)
            return commandResolve()
        }

        /* istanbul ignore if */
        if (m.name === 'eval') {
            repl.eval(m.content.cmd, global, null, (e, result) => {
                if (e) {
                    process.send({
                        origin: 'debugger',
                        name: 'result',
                        params: {
                            error: true,
                            ...serializeError(e)
                        }
                    })
                }

                /**
                 * try to do some smart serializations
                 */
                if (typeof result === 'function') {
                    result = `[Function: ${result.name}]`
                }

                process.send({
                    origin: 'debugger',
                    name: 'result',
                    params: { result }
                })
            })
        }
    })

    return new Promise((resolve) => (commandResolve = resolve))
}
