import command from '../scripts/executeAsyncScript'
import { transformExecuteArgs, transformExecuteResult } from '../utils'
import { SERIALIZE_PROPERTY, SERIALIZE_FLAG } from '../constants'

export default async function executeAsyncScript ({ script, args }) {
    const page = this.windows.get(this.currentWindowHandle)
    const scriptTimeout = this.timeouts.get('script')
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
