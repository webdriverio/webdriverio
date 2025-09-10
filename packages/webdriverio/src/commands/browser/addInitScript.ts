import type { local, remote } from 'webdriver'

import { deserialize } from '../../utils/bidi/index.js'

/**
 * Adds a script which would be evaluated in one of the following scenarios:
 *
 * - Whenever the page is navigated.
 * - Whenever the child frame is attached or navigated. In this case, the script is evaluated in
 *   the context of the newly attached frame.
 *
 * The script is evaluated after the document was created but before any of its scripts were run.
 * In order to remove the initialization script from the page again, call the function that got
 * returned by this function.
 *
 * This is useful to amend the JavaScript environment, e.g. to seed Math.random.
 *
 * <example>
    :addInitScript.js
    const script = await browser.addInitScript((seed) => {
        Math.random = () => seed
    }, 42)

    await browser.url('https://webdriver.io')
    console.log(await browser.execute(() => Math.random())) // returns 42

    await reset()
    await browser.url('https://webdriver.io')
    console.log(await browser.execute(() => Math.random())) // returns a random number
 * </example>
 *
 * Furthermore you can also use the `emit` function to send data back to the Node.js environment.
 * This is useful if you want to observe certain events in the browser environment, e.g.:
 *
 * <example>
    :addInitScriptWithEmit.js
    const script = await browser.addInitScript((emit) => {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          emit(mutation.target.nodeName)
        }
      })
      observer.observe(document, { childList: true, subtree: true })
    })

    script.on('data', (data) => {
      console.log(data) // prints: BODY, DIV, P, ...
    })
 * </example>
 *
 * @alias browser.addInitScript
 * @param {Function}              script  function to be injected as initialization script
 * @param {number|string|boolean} args    parameters for the script
 * @type utility
 *
 */

export async function addInitScript<Payload> (
    this: WebdriverIO.Browser,
    script: string | InitScriptFunction<Payload>,
): Promise<InitScript<Payload>>
export async function addInitScript<Payload, Arg1> (
    this: WebdriverIO.Browser,
    script: string | InitScriptFunctionArg1<Payload, Arg1>,
    arg1: Arg1
): Promise<InitScript<Payload>>
export async function addInitScript<Payload, Arg1, Arg2> (
    this: WebdriverIO.Browser,
    script: string | InitScriptFunctionArg2<Payload, Arg1, Arg2>,
    arg1: Arg1,
    arg2: Arg2
): Promise<InitScript<Payload>>
export async function addInitScript<Payload, Arg1, Arg2, Arg3> (
    this: WebdriverIO.Browser,
    script: string | InitScriptFunctionArg3<Payload, Arg1, Arg2, Arg3>,
    arg1: Arg1,
    arg2: Arg2,
    arg3: Arg3
): Promise<InitScript<Payload>>
export async function addInitScript<Payload, Arg1, Arg2, Arg3, Arg4> (
    this: WebdriverIO.Browser,
    script: string | InitScriptFunctionArg4<Payload, Arg1, Arg2, Arg3, Arg4>,
    arg1: Arg1,
    arg2: Arg2,
    arg3: Arg3,
    arg4: Arg4
): Promise<InitScript<Payload>>
export async function addInitScript<Payload, Arg1, Arg2, Arg3, Arg4, Arg5> (
    this: WebdriverIO.Browser,
    script: string | InitScriptFunctionArg5<Payload, Arg1, Arg2, Arg3, Arg4, Arg5>,
    arg1: Arg1,
    arg2: Arg2,
    arg3: Arg3,
    arg4: Arg4,
    arg5: Arg5
): Promise<InitScript<Payload>>
export async function addInitScript<Payload, Arg1, Arg2, Arg3, Arg4, Arg5> (
    this: WebdriverIO.Browser,
    script: string | InitScriptFunction<Payload> | InitScriptFunctionArg1<Payload, Arg1> | InitScriptFunctionArg2<Payload, Arg1, Arg2> | InitScriptFunctionArg3<Payload, Arg1, Arg2, Arg3> | InitScriptFunctionArg4<Payload, Arg1, Arg2, Arg3, Arg4> | InitScriptFunctionArg5<Payload, Arg1, Arg2, Arg3, Arg4, Arg5>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any
): Promise<InitScript<Payload>> {
    /**
     * parameter check
     */
    if (typeof script !== 'function') {
        throw new Error('The `addInitScript` command requires a function as first parameter, but got: ' + typeof script)
    }

    if (!this.isBidi) {
        throw new Error('This command is only supported when automating browser using WebDriver Bidi protocol')
    }

    const serializedParameters = (args || []).map((arg: unknown) => JSON.stringify(arg))
    const context = await this.getWindowHandle()
    const src = 'return ' + script.toString()
    const fn = `(emit) => {
        const closure = new Function(${JSON.stringify(src)})
        return closure()(${serializedParameters.length ? `${serializedParameters.join(', ')}, emit` : 'emit'})
    }`
    const channel = btoa(fn.toString())
    const result = await this.scriptAddPreloadScript({
        functionDeclaration: fn,
        arguments: [{
            type: 'channel',
            value: { channel }
        }],
        contexts: [context]
    })

    await this.sessionSubscribe({
        events: ['script.message']
    })
    const eventHandler: Map<string, EventHandlerFunction<Payload>[]> = new Map()
    const messageHandler = (msg: local.ScriptMessageParameters) => {
        if (msg.channel === channel) {
            const handler = eventHandler.get('data') || []
            return handler.forEach((fn) => fn(deserialize(msg.data as remote.ScriptLocalValue)))
        }
    }
    this.on('script.message', messageHandler)
    const resetFn = (() => {
        eventHandler.clear()
        this.off('script.message', messageHandler)
        return this.scriptRemovePreloadScript({ script: result.script })
    }) as unknown as () => Promise<void>

    const returnVal: InitScript<Payload> = {
        remove: resetFn,
        on: (event: 'data', listener: (data: Payload) => void) => {
            if (!eventHandler.has(event)) {
                eventHandler.set(event, [])
            }
            eventHandler.get(event)?.push(listener)
        }
    }
    return returnVal
}

type EventHandlerFunction<Payload> = (data: Payload) => void

/**
 * Callback to emit data from the browser back to the Node.js environment. In order to receive the
 * data returned by the callback function you have to listen to the `data` event, e.g.
 *
 * ```js
 * const script = await browser.addInitScript((emit) => {
 *    emit('hello')
 * })
 * script.on('data', (data) => {
 *   console.log(data) // prints: hello
 * })
 * ```
 *
 * @param {any} data  The data to emit.
 */
type InitScriptCallback<Payload> = (data: Payload) => void

type InitScriptFunction<Payload> = ((emit: InitScriptCallback<Payload>) => void | Promise<void>)
type InitScriptFunctionArg1<Payload, Arg1> = ((arg1: Arg1, emit: InitScriptCallback<Payload>) => void | Promise<void>)
type InitScriptFunctionArg2<Payload, Arg1, Arg2> = ((arg1: Arg1, arg2: Arg2, emit: InitScriptCallback<Payload>) => void | Promise<void>)
type InitScriptFunctionArg3<Payload, Arg1, Arg2, Arg3> = ((arg1: Arg1, arg2: Arg2, arg3: Arg3, emit: InitScriptCallback<Payload>) => void | Promise<void>)
type InitScriptFunctionArg4<Payload, Arg1, Arg2, Arg3, Arg4> = ((arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, emit: InitScriptCallback<Payload>) => void | Promise<void>)
type InitScriptFunctionArg5<Payload, Arg1, Arg2, Arg3, Arg4, Arg5> = ((arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5, emit: InitScriptCallback<Payload>) => void | Promise<void>)

export interface InitScript<Payload = undefined> {
    remove: () => Promise<void>
    on: (event: 'data', listener: (data: Payload) => void) => void
}
