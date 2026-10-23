import { serializeError } from 'serialize-error'
import WDIORepl from '@wdio/repl'

import { environment } from '../../environment.js'

export interface DebugOptions {
    /**
     * Time in milliseconds before a REPL command times out (defaults to 5000).
     */
    commandTimeout?: number
    /**
     * Local variables or page objects to expose in the REPL context.
     */
    context?: Record<string, unknown>
}

function parseDebugArgs(
    commandTimeoutOrOptions: number | DebugOptions | Record<string, unknown> = 5000,
    contextArg?: Record<string, unknown>
): { commandTimeout: number, customContext: Record<string, unknown> } {
    if (typeof commandTimeoutOrOptions === 'number') {
        return {
            commandTimeout: commandTimeoutOrOptions,
            customContext: contextArg ?? {}
        }
    }

    if (commandTimeoutOrOptions && typeof commandTimeoutOrOptions === 'object') {
        const keys = Object.keys(commandTimeoutOrOptions)
        const isOptionsObject = keys.length > 0 &&
            keys.every((key) => key === 'commandTimeout' || key === 'context') &&
            (typeof commandTimeoutOrOptions.commandTimeout === 'number' || typeof commandTimeoutOrOptions.commandTimeout === 'undefined') &&
            (
                (typeof commandTimeoutOrOptions.context === 'object' && commandTimeoutOrOptions.context !== null) ||
                typeof commandTimeoutOrOptions.context === 'undefined'
            )

        if (isOptionsObject) {
            const opts = commandTimeoutOrOptions as DebugOptions
            return {
                commandTimeout: opts.commandTimeout ?? 5000,
                customContext: opts.context ?? {}
            }
        }

        return {
            commandTimeout: 5000,
            customContext: commandTimeoutOrOptions as Record<string, unknown>
        }
    }

    return {
        commandTimeout: 5000,
        customContext: contextArg ?? {}
    }
}

function getDebugContext(
    browser: WebdriverIO.Browser,
    customContext: Record<string, unknown>
): Record<string, unknown> {
    const process = globalThis.process as NodeJS.Process | undefined
    const cwd = typeof process?.cwd === 'function' ? process.cwd() : '/'
    const createRequireFn = environment.value.createRequire
    const globalRequire = (globalThis as { require?: NodeJS.Require }).require
    const localRequire = typeof createRequireFn === 'function'
        ? createRequireFn(`${cwd.endsWith('/') ? cwd : `${cwd}/`}index.js`)
        : typeof globalRequire === 'function'
            ? globalRequire
            : undefined

    const context: Record<string, unknown> = {}
    for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(globalThis))) {
        if (key === 'global' || key === 'globalThis') {
            continue
        }
        try {
            if ('value' in descriptor) {
                Object.defineProperty(context, key, {
                    ...descriptor,
                    configurable: true,
                    writable: true
                })
            } else if (typeof descriptor.get === 'function') {
                const getter = descriptor.get
                const setter = descriptor.set
                Object.defineProperty(context, key, {
                    ...descriptor,
                    configurable: true,
                    get: () => getter.call(globalThis),
                    ...(typeof setter === 'function' ? { set: (val: unknown) => setter.call(globalThis, val) } : {})
                })
            }
        } catch {
            // ignore non-configurable host properties
        }
    }

    const overrides: Record<string, unknown> = {
        global: globalThis,
        ...(typeof process !== 'undefined' ? { process } : {}),
        browser,
        driver: browser,
        $: browser.$.bind(browser),
        $$: browser.$$.bind(browser),
        ...(localRequire ? { require: localRequire } : {}),
        ...customContext
    }

    for (const [key, value] of Object.entries(overrides)) {
        Object.defineProperty(context, key, {
            value,
            configurable: true,
            enumerable: true,
            writable: true
        })
    }

    return context
}

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
 * </example>
 *
 * <example>
    :context.js
    it('should pass local variables into the debug REPL', async () => {
        const expectedUser = 'tomsmith'
        await browser.debug({
            commandTimeout: 10000,
            context: { loginPage, expectedUser }
        })
    })
 * </example>
 *
 * @alias browser.debug
 * @param {number|DebugOptions|Record<string, unknown>=} commandTimeout command timeout in ms, a `DebugOptions` object, or a context object with local variables to expose in the REPL
 * @param {Record<string, unknown>=} context local variables or page objects to expose in the REPL context
 * @type utility
 *
 */
export function debug(
    this: WebdriverIO.Browser,
    commandTimeout: number | DebugOptions | Record<string, unknown> = 5000,
    context?: Record<string, unknown>
): Promise<void | unknown> {
    const { commandTimeout: resolvedTimeout, customContext } = parseDebugArgs(commandTimeout, context)
    const repl = new WDIORepl({ commandTimeout: resolvedTimeout })
    const { introMessage } = WDIORepl
    const process = globalThis.process as NodeJS.Process
    const evalContext = getDebugContext(this, customContext)

    /**
     * run repl in standalone mode
     */
    if (!environment.value.variables.WDIO_WORKER_ID || typeof process.send !== 'function') {
        console.log(WDIORepl.introMessage)
        return repl.start(evalContext)
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
        params: { commandTimeout: resolvedTimeout, introMessage }
    })

    let commandResolve = /* istanbul ignore next */ () => { }
    const onMessage = (m: { name: string, origin: string, content: { cmd: string } }) => {
        if (m.origin !== 'debugger') {
            return
        }

        if (m.name === 'stop') {
            process.off?.('message', onMessage)
            process._debugEnd(process.pid)
            return commandResolve()
        }

        /* istanbul ignore if */
        if (m.name === 'eval') {
            repl.eval(m.content.cmd, evalContext, undefined, (err: Error | null, result: unknown) => {
                if (typeof process.send !== 'function') {
                    return
                }

                if (err) {
                    return process.send({
                        origin: 'debugger',
                        name: 'result',
                        params: {
                            error: true,
                            ...serializeError(err)
                        }
                    })
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
                    const label = (result as { constructor?: { name?: string } })?.constructor?.name || 'Object'
                    process.send({
                        origin: 'debugger',
                        name: 'result',
                        params: { result: `[${typeof result}: ${label}]` }
                    })
                }
            })
        }
    }
    process.on('message', onMessage)

    return new Promise<void>((resolve) => (commandResolve = resolve))
}
