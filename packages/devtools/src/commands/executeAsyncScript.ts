import command from '../scripts/executeAsyncScript.js'
import { transformExecuteArgs, transformExecuteResult } from '../utils.js'
import { SERIALIZE_PROPERTY, SERIALIZE_FLAG } from '../constants.js'
import type DevToolsDriver from '../devtoolsdriver.js'

/**
 * The Execute Async Script command causes JavaScript to execute as an anonymous function.
 * Unlike the Execute Script command, the result of the function is ignored.
 * Instead an additional argument is provided as the final argument to the function.
 * This is a function that, when called, returns its first argument as the response.
 *
 * @alias browser.executeScript
 * @see https://w3c.github.io/webdriver/#dfn-execute-async-script
 * @param {string} script  a string, the Javascript function body you want executed
 * @param {*[]}    args    an array of JSON values which will be deserialized and passed as arguments to your function
 * @return *               Either the return value of your script, the fulfillment of the Promise returned by your script, or the error which was the reason for your script's returned Promise's rejection.
 */
export default async function executeAsyncScript (
    this: DevToolsDriver,
    { script, args }: { script: string, args: any[] }
) {
    const page = this.getPageHandle(true)
    const scriptTimeout = this.timeouts.get('script') || 0
    script = script.trim()

    if (script.startsWith('return (')) {
        script = script.slice(7)
    }

    if (script.startsWith('return')) {
        script = `(function () { ${script} }).apply(null, arguments)`
    }

    const result = await page.$eval(
        'html',
        command,
        script,
        scriptTimeout,
        SERIALIZE_PROPERTY,
        SERIALIZE_FLAG,
        ...(await transformExecuteArgs.call(this, args))
    )

    return transformExecuteResult.call(this, page, result)
}
