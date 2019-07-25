/* global window, HTMLElement, NodeList */
import { transformExecuteArgs, findElement } from '../utils'

export default async function executeScript ({ script, args }) {
    const page = this.windows.get(this.currentWindowHandle)
    const dataProperty = 'data-devtoolsdriver-activeElement'
    const dataFlag = '__executeElement'
    const selector = `[${dataProperty}]`

    const result = await page.$eval('html', (_, script, dataProperty, dataFlag, ...args) => {
        window.arguments = args
        const result = eval(script.slice(7))
        let tmpResult = result instanceof NodeList ? Array.from(result) : result
        const isResultArray = Array.isArray(tmpResult)
        tmpResult = isResultArray ? tmpResult : [tmpResult]

        if (tmpResult.find((r) => r instanceof HTMLElement)) {
            tmpResult = tmpResult.map((r) => {
                if (r instanceof HTMLElement) {
                    r.setAttribute(dataProperty, true)
                    return dataFlag
                }

                return result
            })
        }

        return isResultArray ? tmpResult : tmpResult[0]
    }, script, dataProperty, dataFlag, ...transformExecuteArgs.call(this, args))

    const isResultArray = Array.isArray(result)
    let tmpResult = isResultArray ? result : [result]

    if (tmpResult.find((r) => r === dataFlag)) {
        tmpResult = await Promise.all(tmpResult.map(async (r) => {
            if (r === dataFlag) {
                return findElement.call(this, page, selector)
            }

            return result
        }))

        await page.$$eval(selector, (executeElements, dataProperty) => {
            for (const elem of executeElements) {
                elem.removeAttribute(dataProperty)
            }
        }, dataProperty)
    }

    return isResultArray ? tmpResult : tmpResult[0]
}
