/**
 * 
 * The Execute Async Script command causes JavaScript to execute as an anonymous function. 
 * Unlike the Execute Script command, the result of the function is ignored. 
 * Instead an additional argument is provided as the final argument to the function. 
 * This is a function that, when called, returns its first argument as the response.
 */

import command from '../scripts/executeAsyncScript'
import { transformExecuteArgs, transformExecuteResult } from '../utils'
import { SERIALIZE_PROPERTY, SERIALIZE_FLAG } from '../constants'

export default async function executeAsyncScript ({ script, args }) {
    const page = this.getPageHandle(true)
    const scriptTimeout = this.timeouts.get('script')
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
        ...transformExecuteArgs.call(this, args)
    )

    return transformExecuteResult.call(this, page, result)
}
