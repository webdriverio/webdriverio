import { getBrowserObject } from '@wdio/utils'
import type { remote } from 'webdriver'

import { verifyArgsAndStripIfElement, createFunctionDeclarationFromString } from '../../utils/index.js'
import { LocalValue } from '../../utils/bidi/value.js'
import { parseScriptResult } from '../../utils/bidi/index.js'
import { createSerializableScript } from '../../utils/bidi/serialize.js'
import { getContextManager } from '../../session/context.js'
import { polyfillFn } from '../../scripts/polyfill.js'
import type { TransformElement, TransformReturn } from '../../types.js'

/**
 *
 * Inject a snippet of JavaScript into the page for execution in the context of the currently selected frame.
 * The executed script is assumed to be synchronous and the result of evaluating the script is returned to
 * the client. An `async` function is awaited on both WebDriver Classic and BiDi, which replaces `executeAsync`.
 *
 * The script argument defines the script to execute in the form of a function body. The value returned by
 * that function will be returned to the client. The function will be invoked with the provided args array
 * and the values may be accessed via the arguments object in the order specified.
 *
 * Arguments may be any JSON-primitive, array, or JSON object. JSON objects that define a WebElement
 * reference will be converted to the corresponding DOM element. Likewise, any WebElements in the script
 * result will be returned to the client as WebElement JSON objects.
 *
 * BiDi sessions preserve `Blob` and `File` results. The value arrives in the test as a `Blob` or
 * `File`; read it with `text()` or `arrayBuffer()`. A `Blob` or `File` nested in an array, plain
 * object, class instance, `Map`, or `Set` is preserved the same way. A `FileList` that contains
 * files is returned as an array of `File` objects. A cyclic reference inside a value that also
 * contains a `Blob` or `File` is returned as `null`.
 *
 * <example>
    :execute.js
    it('should inject javascript on the page', async () => {
        const result = await browser.execute((a, b, c, d) => {
            // browser context - you may not access client or console
            return a + b + c + d
        }, 1, 2, 3, 4)
        // node.js context - client and console are available
        console.log(result) // outputs: 10
    });

    :blob.js
    it('should return a blob from the browser', async () => {
        const blob = await browser.execute(() => new Blob(['hello'], { type: 'text/plain' }))
        console.log(blob.type) // outputs: text/plain
        console.log(await blob.text()) // outputs: hello
    });
 * </example>
 *
 * @param {String|Function} script     The script to execute.
 * @param {*=}              arguments  script arguments
 *
 * @return {*}             The script result.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-execute-script
 * @type protocol
 *
 */
export async function execute<ReturnValue, InnerArguments extends unknown[]> (
    this: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser,
    script: string | ((...innerArgs: TransformElement<InnerArguments>) => ReturnValue | Promise<ReturnValue>),
    ...args: InnerArguments
): Promise<TransformReturn<Awaited<ReturnValue>>> {
    /**
     * parameter check
     */
    if ((typeof script !== 'string' && typeof script !== 'function')) {
        throw new Error('number or type of arguments don\'t agree with execute protocol command')
    }

    if (this.isBidi && !this.isMultiremote) {
        const browser = getBrowserObject(this)
        const contextManager = getContextManager(browser)
        const context = await contextManager.getCurrentContext()
        const userScript = typeof script === 'string' ? new Function(script) : script
        const functionDeclaration = createFunctionDeclarationFromString(new Function(createSerializableScript(userScript)))
        const params: remote.ScriptCallFunctionParameters = {
            functionDeclaration,
            awaitPromise: true,
            arguments: args.map((arg) => LocalValue.getArgument(arg)) as remote.ScriptLocalValue[],
            target: {
                context
            }
        }
        const result = await browser.scriptCallFunction(params)
        return parseScriptResult(params, result)
    }

    /**
     * instances started as multibrowserinstance can't getting called with
     * a function parameter, therefore we need to check if it starts with "function () {"
     *
     * Classic Execute Script does not wait for a returned promise. Async functions
     * go through Execute Async Script so `await` inside the script still resolves.
     */
    const isAsyncFn = typeof script === 'function' && script.constructor.name === 'AsyncFunction'
    if (typeof script === 'function') {
        script = isAsyncFn
            ? `
            ${polyfillFn}
            webdriverioPolyfill();
            var done = arguments[arguments.length - 1];
            var args = Array.prototype.slice.call(arguments, 0, -1);
            Promise.resolve((${script}).apply(null, args)).then(function (result) {
                done(result)
            }, function (error) {
                done({
                    __wdioError: true,
                    message: error && error.message ? error.message : String(error),
                    stack: error && error.stack,
                    name: error && error.name
                })
            })
        `
            : `
            ${polyfillFn}
            webdriverioPolyfill();
            return (${script}).apply(null, arguments)
        `
    }

    const scriptArgs = verifyArgsAndStripIfElement(args) as (string | number | boolean)[]
    if (isAsyncFn) {
        const result = await this.executeAsyncScript(script, scriptArgs)
        if (isScriptError(result)) {
            const error = new Error(result.message)
            if (result.name) {
                error.name = result.name
            }
            if (result.stack) {
                error.stack = result.stack
            }
            throw error
        }
        return result as TransformReturn<Awaited<ReturnValue>>
    }

    return this.executeScript(script, scriptArgs)
}

function isScriptError (result: unknown): result is { __wdioError: true, message: string, name?: string, stack?: string } {
    return Boolean(
        result &&
        typeof result === 'object' &&
        (result as { __wdioError?: unknown }).__wdioError === true
    )
}
