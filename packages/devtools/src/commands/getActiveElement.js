import findElement from './findElement'
import command, { cleanUp } from '../scripts/getActiveElement'

export default async function getActiveElement () {
    const page = this.windows.get(this.currentWindowHandle)
    const dataProperty = 'data-devtoolsdriver-activeElement'
    const selector = `[${dataProperty}]`

    /**
     * set data property to active element to allow to query for it
     */
    const hasElem = await page.$eval('html', command, dataProperty)

    if (!hasElem) {
        throw new Error('no element active')
    }

    /**
     * query for element
     */
    const activeElement = await findElement.call(this, {
        using: 'css selector',
        value: selector
    })

    /**
     * clean up data property
     */
    await page.$eval(selector, cleanUp, dataProperty)

    return activeElement
}
