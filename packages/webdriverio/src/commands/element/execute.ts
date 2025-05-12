import { getBrowserObject } from '@wdio/utils'
import type { TransformElement, TransformReturn } from '../../types.js'

/**
 *
 * Inject a snippet of JavaScript into the page for execution in the context of the currently selected
 * frame using the given element as scope, because it is on the element scope it means that WebdriverIO will
 * automatically wait for the element to exist before executing the script.
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
    it('should wait for the element to exist, then executes javascript on the page with the element as first argument', async () => {
        const text = await $('div').execute((elem, a, b, c, d) => {
            return elem.textContent + a + b + c + d
        }, 1, 2, 3, 4);
        // node.js context - client and console are available
        console.log(text); // outputs "Hello World1234"
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
    /**
     * `this` has to be typed `unknown` as we can't otherwise assign it to the element, due to:
     * ```
     * The 'this' context of type 'ChainablePromiseElement' is not assignable to method's 'this' of type 'Element'.
     *   Types of property 'parent' are incompatible.
     *     Type 'Promise<Browser | Element | MultiRemoteBrowser>' is not assignable to type 'Browser | Element'.
     * ```
     */
    this: unknown,
    script: string | ((...innerArgs: TransformElement<[WebdriverIO.Element, ...InnerArguments]>) => ReturnValue),
    ...args: InnerArguments
): Promise<TransformReturn<ReturnValue>> {
    const scope = this as WebdriverIO.Element
    const browser = getBrowserObject(scope)
    await scope.waitForExist()
    return browser.execute(script, scope, ...args)
}
