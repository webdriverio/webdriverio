import { ELEMENT_KEY } from 'webdriver'

import { getElement } from '../../utils/getElementObject.js'
import { getBrowserObject } from '../../utils/index.js'
import type { CustomStrategyFunction } from '../../types.js'

/**
 *
 * The `custom$` allows you to use a custom strategy declared by using `browser.addLocatorStrategy`.
 * Read more on custom selector stratgies in the [Selector docs](../../selectors#custom-selector-strategies).
 *
 * <example>
    :example.js
    it('should fetch the project title', async () => {
        await browser.url('https://webdriver.io')
        await browser.addLocatorStrategy('myStrat', (selector) => {
            return document.querySelectorAll(selector)
        })

        const header = await browser.custom$('myStrat', 'header')
        const projectTitle = await header.custom$('myStrat', '.projectTitle')

        console.log(projectTitle.getText()) // WEBDRIVER I/O
    })
 * </example>
 *
 * @alias custom$
 * @param {string} strategyName
 * @param {*} strategyArguments
 * @example https://github.com/webdriverio/example-recipes/blob/f5730428ec3605e856e90bf58be17c9c9da891de/queryElements/customStrategy.js#L2-L11
 * @example https://github.com/webdriverio/example-recipes/blob/f5730428ec3605e856e90bf58be17c9c9da891de/queryElements/example.html#L8-L12
 * @example https://github.com/webdriverio/example-recipes/blob/f5730428ec3605e856e90bf58be17c9c9da891de/queryElements/customStrategy.js#L16-L19
 * @return {Element}
 */
export async function custom$ (
    this: WebdriverIO.Element,
    strategyName: string,
    ...strategyArguments: any[]
) {
    const browserObject = getBrowserObject(this)
    const strategy = browserObject.strategies.get(strategyName) as CustomStrategyFunction

    if (!strategy) {
        throw Error('No strategy found for ' + strategyName)
    }

    /**
     * fail if root element is not found, similar to:
     * $('.notExisting').$('.someElem')
     */
    if (!this.elementId) {
        throw Error(`Can't call custom$ on element with selector "${this.selector}" because element wasn't found`)
    }

    const strategyRef = { strategy, strategyName, strategyArguments: [...strategyArguments, this] }

    let res = await browserObject.execute(strategy, ...strategyArguments, this)

    /**
     * if the user's script returns multiple elements
     * then we just return the first one as this method
     * is intended to return just one element
     */
    if (Array.isArray(res)) {
        res = res[0]
    }

    if (res && typeof res[ELEMENT_KEY] === 'string') {
        return await getElement.call(this, strategyRef, res)
    }

    return await getElement.call(this, strategyRef, new Error('no such element'))
}
