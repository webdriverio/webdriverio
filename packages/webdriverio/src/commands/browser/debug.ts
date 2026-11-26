import { serializeError } from 'serialize-error'
import WDIORepl from '@wdio/repl'

import { environment } from '../../environment.js'

/**
 *
 * This command helps you to debug your integration tests. It stops the running browser and gives
 * you time to jump into it and check the state of your application (e.g. using dev tools).
 * Your terminal transforms into a [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop)
 * interface that allows you to try out commands, find elements, access the local Node.js environment
 * (including `require()` and dynamic `import()`), and inspect optional local variables or page objects
 * passed via `context`.
 *
 * [![WebdriverIO REPL](https://webdriver.io/img/repl.gif)](https://webdriver.io/img/repl.gif)
 *
 * If you run the WDIO testrunner make sure you increase the timeout property of the test framework
 * you are using (e.g. Mocha or Jasmine) in order to prevent test termination due to a test timeout.
 * Also avoid executing the command with multiple capabilities running at the same time.
 *
 * <iframe width="560" height="315" src="https://www.youtube.com/embed/xWwP-3B_YyE" frameborder="0" allowFullScreen></iframe>
 *
 * <example>
    :debug.js
    it('should demonstrate the debug command', async () => {
        await $('#input').setValue('FOO')
        await browser.debug() // jumping into the browser and change value of #input to 'BAR'
        const value = await $('#input').getValue()
        console.log(value) // outputs: "BAR"
    })

    :debugWithContext.js
    it('should expose local page objects to the debug REPL', async () => {
        const loginPage = new LoginPage()
        await browser.debug({ context: { loginPage } })
    })
 * </example>
 *
 * @alias browser.debug
 * @param {number|DebugOptions}     [commandTimeout=5000]  timeout for individual REPL commands in ms, or options object
 * @param {Record<string, unknown>} [context]              optional local variables or page objects to expose in the REPL
 * @type utility
 *
 */
export function debug(
    this: WebdriverIO.Browser,
    commandTimeoutOrOptions: number | DebugOptions = 5000,
    context?: Record<string, unknown>
): Promise<void | unknown> {
    const commandTimeout = typeof commandTimeoutOrOptions === 'object' && commandTimeoutOrOptions !== null
        ? (commandTimeoutOrOptions.commandTimeout ?? 5000)
        : commandTimeoutOrOptions
    const localContext = typeof commandTimeoutOrOptions === 'object' && commandTimeoutOrOptions !== null
        ? commandTimeoutOrOptions.context
        : context

    const repl = new WDIORepl({ commandTimeout })
    const { introMessage } = WDIORepl
    const process = globalThis.process as NodeJS.Process
    const baseContext: Record<string, unknown> = {
        browser: this,
        driver: this,
        $: this.$.bind(this),
        $$: this.$$.bind(this)
    }
    if (localContext) {
        Object.defineProperties(baseContext, Object.getOwnPropertyDescriptors(localContext))
    }
    const replContext = WDIORepl.createContext(baseContext)

    /**
     * run repl in standalone mode
     */
    if (!environment.value.variables.WDIO_WORKER_ID || typeof process.send !== 'function') {
        console.log(WDIORepl.introMessage)
        return repl.start(replContext)
    }

    /**
     * register worker process as debugger target
     */
    process._debugProcess(process.pid)

    /**
     * initialize repl in testrunner
     */
    process.send({
        origin: 'debugger',
        name: 'start',
        params: { commandTimeout, introMessage }
    })

    let isStopped = false
    let commandResolve = /* istanbul ignore next */ () => { }
    const onMessage = (m: { name: string, origin: string, content: { cmd: string } }) => {
        if (m.origin !== 'debugger' || isStopped) {
            return
        }

        if (m.name === 'stop') {
            isStopped = true
            if (typeof process.off === 'function') {
                process.off('message', onMessage)
            }
            process._debugEnd(process.pid)
            return commandResolve()
        }

        /* istanbul ignore if */
        if (m.name === 'eval') {
            repl.eval(m.content.cmd, replContext, undefined, (err: Error | null, result: unknown) => {
                if (isStopped || typeof process.send !== 'function') {
                    return
                }

                if (err) {
                    process.send({
                        origin: 'debugger',
                        name: 'result',
                        params: {
                            error: true,
                            ...serializeError(err)
                        }
                    })
                    return
                }

                /**
                 * try to do some smart serializations
                 */
                if (typeof result === 'function') {
                    result = `[Function: ${result.name}]`
                }

                try {
                    process.send({
                        origin: 'debugger',
                        name: 'result',
                        params: { result }
                    })
                } catch {
                    process.send({
                        origin: 'debugger',
                        name: 'result',
                        params: {
                            result: typeof WDIORepl.formatResult === 'function'
                                ? WDIORepl.formatResult(result)
                                : String(result)
                        }
                    })
                }
            })
        }
    }
    process.on('message', onMessage)

    return new Promise<void>((resolve) => (commandResolve = resolve))
}

export interface DebugOptions {
    /**
     * Timeout for individual REPL commands in milliseconds (default: 5000).
     */
    commandTimeout?: number
    /**
     * Local variables, helper functions, or page objects to expose in the REPL context.
     */
    context?: Record<string, unknown>
}
