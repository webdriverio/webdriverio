/**
 * The Execute Script command executes a JavaScript function in the context of the
 * current browsing context and returns the return value of the function.
 *
 * @alias browser.executeScript
 * @see https://w3c.github.io/webdriver/#dfn-execute-script
 * @param {string} script  a string, the Javascript function body you want executed
 * @param {*[]}    args    an array of JSON values which will be deserialized and passed as arguments to your function
 * @return *               Either the return value of your script, the fulfillment of the Promise returned by your script, or the error which was the reason for your script's returned Promise's rejection.
 */

import command from '../scripts/executeScript'
import { transformExecuteArgs, transformExecuteResult } from '../utils'
import { SERIALIZE_PROPERTY, SERIALIZE_FLAG } from '../constants'

export default async function executeScript ({ script, args }) {
    const page = this.getPageHandle(true)
    const scriptTimeout = this.timeouts.get('script')
    script = script.trim()

    if (script.startsWith('return (')) {
        script = script.slice(7)
    }

    if (script.startsWith('return')) {
        script = `(function () { ${script} }).apply(null, arguments)`
    }

    const executePromise = page.$eval(
        'html',
        command,
        script,
        SERIALIZE_PROPERTY,
        SERIALIZE_FLAG,
        ...(await transformExecuteArgs.call(this, args))
    )

    let executeTimeout
    const timeoutPromise = new Promise((_, reject) => {
        executeTimeout = setTimeout(() => {
            const timeoutError = `script timeout${
                this.activeDialog
                    ? ' reason: a browser dialog has opened as result of a executeScript call'
                    : ''
            }`

            return reject(new Error(timeoutError))
        }, scriptTimeout)
    })

    const result = await Promise.race([executePromise, timeoutPromise])
    clearTimeout(executeTimeout)
    return transformExecuteResult.call(this, page, result)
}
