import command from '../scripts/executeScript'
import { transformExecuteArgs, transformExecuteResult } from '../utils'
import { SERIALIZE_PROPERTY, SERIALIZE_FLAG } from '../constants'

export default async function executeScript ({ script, args }) {
    const page = this.windows.get(this.currentWindowHandle)
    const scriptTimeout = this.timeouts.get('script')

    const executePromise = page.$eval(
        'html',
        command,
        script,
        SERIALIZE_PROPERTY,
        SERIALIZE_FLAG,
        ...transformExecuteArgs.call(this, args)
    )

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
            () => {
                const additionalTimeoutInfo = (
                    Boolean(this.activeDialog) &&
                    'a browser dialog has opened as result of a executeScript call'
                )

                return reject(new Error('script timeout' + (additionalTimeoutInfo
                    ? `, reason: ${additionalTimeoutInfo}`
                    : ''
                )))
            },
            scriptTimeout
        )
    })

    const result = await Promise.race([executePromise, timeoutPromise])
    return transformExecuteResult.call(this, page, result)
}
