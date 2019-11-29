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
        ...transformExecuteArgs.call(this, args)
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
