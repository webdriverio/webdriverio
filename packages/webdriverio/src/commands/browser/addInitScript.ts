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
    :execute.js
    const reset = await browser.addInitScript((seed) => {
        Math.random = () => seed
    }, 42)

    await browser.url('https://webdriver.io')
    console.log(await browser.execute(() => Math.random())) // returns 42

    await reset()
    await browser.url('https://webdriver.io')
    console.log(await browser.execute(() => Math.random())) // returns a random number
 * </example>
 *
 * @alias browser.addInitScript
 * @param {Function}       script  function to be injected as initialization script
 * @param {Serializable[]} args    parameters for the script
 * @type utility
 *
 */

export async function addInitScript<ReturnValue, InnerArguments extends any[]> (
    this: WebdriverIO.Browser,
    script: string | ((...innerArgs: InnerArguments) => ReturnValue),
    ...args: InnerArguments
): Promise<() => Promise<void>> {
    /**
     * parameter check
     */
    if (typeof script !== 'function') {
        throw new Error('The `addInitScript` command requires a function as first parameter, but got: ' + typeof script)
    }

    if (!this.isBidi) {
        throw new Error('This command is only supported when automating browser using WebDriver Bidi protocol')
    }

    let serializedParameters = []
    try {
        serializedParameters = args.map(arg => JSON.stringify(arg))
    } catch (err) {
        throw new Error('The `addInitScript` command requires all parameters to be JSON serializable: ${err.message}')
    }

    const context = await this.getWindowHandle()
    const result = await this.scriptAddPreloadScript({
        functionDeclaration: `() => {
            const closure = new Function(\`return ${script.toString()}\`)
            return closure()(${serializedParameters.join(', ')})
        }`,
        arguments: [],
        contexts: [context]
    })

    const resetFn = (() => this.scriptRemovePreloadScript({ script: result.script })) as unknown as () => Promise<void>
    return resetFn
}

