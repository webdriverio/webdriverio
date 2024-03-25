import { verifyArgsAndStripIfElement } from '../../utils/index.js'

/**
 *
 * Inject a snippet of JavaScript into the page for execution in the context of the currently selected
 * frame using the given element as scope, because it is on the element scope it means that WebdriverIO will
 * automatically wait for the element to exist before executing the script.
 * The executed script is assumed to be asynchronous and must signal that is done by invoking
 * the provided callback, which is always provided as the final argument to the function. The value
 * to this callback will be returned to the client.
 *
 * Asynchronous script commands may not span page loads. If an unload event is fired while waiting
 * for a script result, an error should be returned to the client.
 *
 * The script argument defines the script to execute in the form of a function body. The function will
 * be invoked with the provided args array and the values may be accessed via the arguments object
 * in the order specified. The final argument will always be a callback function that must be invoked
 * to signal that the script has finished.
 *
 * Arguments may be any JSON-primitive, array, or JSON object. JSON objects that define a WebElement
 * reference will be converted to the corresponding DOM element. Likewise, any WebElements in the script
 * result will be returned to the client as WebElement JSON objects.
 *
 * <example>
    :executeAsync.js
    it('should wait for the element to exist, then executes async javascript on the page with the element as first argument', async () => {
        await browser.setTimeout({ script: 5000 })
        const text = await $('div').execute((elem, a, b, c, d) => {
            // browser context - you may not access client or console
            setTimeout(() => {
                done(elem.textContent + a + b + c + d)
            }, 3000);
        }, 1, 2, 3, 4);
        // node.js context - client and console are available
        // node.js context - client and console are available
        console.log(text); // outputs "Hello World1234"
    });
 * </example>
 *
 * @param {String|Function} script     The script to execute.
 * @param {*=}               arguments  script arguments
 *
 * @return {*}             The script result.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-execute-async-script
 * @type protocol
 *
 */
export async function executeAsync<ReturnValue, InnerArguments extends any[]> (
    this: ChainablePromiseElement,
    script:
        string |
        ((...args: [...innerArgs: [WebdriverIO.Element, ...InnerArguments], callback: (result?: ReturnValue) => void]) => void),
    ...args: InnerArguments
): Promise<ReturnValue> {
    /**
     * parameter check
     */
    if ((typeof script !== 'string' && typeof script !== 'function')) {
        throw new Error('number or type of arguments don\'t agree with execute protocol command')
    }

    /**
     * instances started as multibrowserinstance can't getting called with
     * a function parameter, therefore we need to check if it starts with "function () {"
     */
    if (typeof script === 'function') {
        script = `return (${script}).apply(null, arguments)`
    }

    return this.executeAsyncScript(script, verifyArgsAndStripIfElement([this, ...args]))
}
