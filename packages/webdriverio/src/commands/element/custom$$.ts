import { ELEMENT_KEY } from 'webdriver'
import { getBrowserObject } from '@wdio/utils'

import { getElements } from '../../utils/getElementObject.js'
import { enhanceElementsArray } from '../../utils/index.js'
import type { CustomStrategyFunction } from '../../types.js'

/**
 *
 * The `customs$$` allows you to use a custom strategy declared by using `browser.addLocatorStrategy`.
 * Read more on custom selector stratgies in the [Selector docs](../../selectors#custom-selector-strategies).
 *
 * <example>
    :example.js
    it('should get all the plugin wrapper buttons', async () => {
        await browser.url('https://webdriver.io')
        await browser.addLocatorStrategy('myStrat', (selector) => {
            return document.querySelectorAll(selector)
        })

        const pluginRowBlock = await browser.custom$('myStrat', '.pluginRowBlock')
        const pluginWrapper = await pluginRowBlock.custom$$('myStrat', '.pluginWrapper')

        console.log(pluginWrapper.length) // 4
    })
 * </example>
 *
 * @alias custom$$
 * @param {string} strategyName
 * @param {*} strategyArguments
 * @return {ElementArray}
 */
export async function custom$$ (
    this: WebdriverIO.Element,
    strategyName: string,
    ...strategyArguments: any[]
): Promise<WebdriverIO.ElementArray> {
    const browserObject = getBrowserObject(this)
    const strategy = browserObject.strategies.get(strategyName) as CustomStrategyFunction

    if (!strategy) {
        /* istanbul ignore next */
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
     * if the user's script return just one element
     * then we convert it to an array as this method
     * should return multiple elements
     */
    if (!Array.isArray(res)) {
        res = [res]
    }

    res = res.filter((el) => !!el && typeof el[ELEMENT_KEY] === 'string')

    const elements = res.length ? await getElements.call(this, strategyRef, res) : [] as WebdriverIO.Element[]
    return enhanceElementsArray(elements, this, strategyName, 'custom$$', strategyArguments)
}
