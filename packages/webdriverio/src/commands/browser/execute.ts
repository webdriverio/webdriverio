import { getBrowserObject } from '@wdio/utils'
import type { remote } from 'webdriver'

import { verifyArgsAndStripIfElement } from '../../utils/index.js'
import { LocalValue } from '../../utils/bidi/value.js'
import { parseScriptResult } from '../../utils/bidi/index.js'
import { getContextManager } from '../../context.js'
import { SCRIPT_PREFIX, SCRIPT_SUFFIX } from '../constant.js'
import { getShadowRootManager } from '../../shadowRoot.js'

/**
 *
 * Inject a snippet of JavaScript into the page for execution in the context of the currently selected frame.
 * The executed script is assumed to be synchronous and the result of evaluating the script is returned to
 * the client.
 *
 * The script argument defines the script to execute in the form of a function body. The value returned by
 * that function will be returned to the client. The function will be invoked with the provided args array
 * and the values may be accessed via the arguments object in the order specified.
 *
 * Arguments may be any JSON-primitive, array, or JSON object. JSON objects that define a WebElement
 * reference will be converted to the corresponding DOM element. Likewise, any WebElements in the script
 * result will be returned to the client as WebElement JSON objects.
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
export async function execute<ReturnValue, InnerArguments extends any[]> (
    this: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser,
    script: string | ((...innerArgs: InnerArguments) => ReturnValue),
    ...args: InnerArguments
): Promise<ReturnValue> {
    /**
     * parameter check
     */
    if ((typeof script !== 'string' && typeof script !== 'function')) {
        throw new Error('number or type of arguments don\'t agree with execute protocol command')
    }

    /**
     * make sure we are not in an iframe (because it is currently not supported to locate nodes in an iframe via Bidi)
     */
    if (this.isBidi && !this.isMultiremote && !getShadowRootManager(this).isWithinFrame()) {
        const browser = getBrowserObject(this)
        const contextManager = getContextManager(browser)
        const context = await contextManager.getCurrentContext()
        const userScript = typeof script === 'string' ? new Function(script) : script
        const functionDeclaration = new Function(`
            return (${SCRIPT_PREFIX}${userScript.toString()}${SCRIPT_SUFFIX}).apply(this, arguments);
        `).toString()
        const params: remote.ScriptCallFunctionParameters = {
            functionDeclaration,
            awaitPromise: true,
            arguments: args.map((arg) => LocalValue.getArgument(arg)) as any,
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
     */
    if (typeof script === 'function') {
        script = `return (${script}).apply(null, arguments)`
    }

    return this.executeScript(script, verifyArgsAndStripIfElement(args))
}
