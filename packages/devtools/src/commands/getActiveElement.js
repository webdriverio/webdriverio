/* global document */
import findElement from './findElement'

export default async function getActiveElement () {
    const page = this.windows.get(this.currentWindowHandle)
    const dataProperty = 'data-devtoolsdriver-activeElement'
    const selector = `[${dataProperty}]`

    /**
     * set data property to active element to allow to query for it
     */
    const hasElem = await page.$eval('html', (_, dataProperty) => {
        if (!document.activeElement) {
            return false
        }

        document.activeElement.setAttribute(dataProperty, true)
        return true
    }, dataProperty)

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
    await page.$eval(
        selector,
        (elem, dataProperty) => elem.removeAttribute(dataProperty),
        dataProperty
    )

    return activeElement
}
