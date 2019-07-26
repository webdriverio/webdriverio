import command from '../scripts/executeScript'
import { transformExecuteArgs, transformExecuteResult } from '../utils'
import { SERIALIZE_PROPERTY, SERIALIZE_FLAG } from '../constants'

export default async function executeScript ({ script, args }) {
    const page = this.windows.get(this.currentWindowHandle)
    const result = await page.$eval(
        'html',
        command,
        script,
        SERIALIZE_PROPERTY,
        SERIALIZE_FLAG,
        ...transformExecuteArgs.call(this, args)
    )

    return transformExecuteResult.call(this, page, result)
}
