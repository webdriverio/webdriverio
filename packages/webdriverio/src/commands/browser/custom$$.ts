import { ELEMENT_KEY } from 'webdriver'

import { getElements } from '../../utils/getElementObject.js'
import { ElementArray } from '../../element/array.js'
import type { CustomStrategyFunction, CustomStrategyReference } from '../../types.js'

/**
 *
 * The `customs$$` allows you to use a custom strategy declared by using `browser.addLocatorStrategy`.
 * Read more on custom selector strategies in the [Selector docs](../../selectors#custom-selector-strategies).
 *
 * <example>
    :example.js
    it('should get all the plugin wrapper buttons', async () => {
        await browser.url('https://webdriver.io')
        await browser.addLocatorStrategy('myStrategy', (selector) => {
            return document.querySelectorAll(selector)
        })

        const pluginWrapper = await browser.custom$$('myStrategy', '.pluginWrapper')

        console.log(await pluginWrapper.length) // 4
    })
 * </example>
 *
 * @alias custom$$
 * @param {string} strategyName
 * @param {*} strategyArguments
 * @return {WebdriverIO.ElementArray}
 */
export function custom$$ (
    this: WebdriverIO.Browser,
    strategyName: string,
    ...strategyArguments: unknown[]
): ElementArray {
    const strategy = this.strategies.get(strategyName) as CustomStrategyFunction

    if (!strategy) {
        throw Error('No strategy found for ' + strategyName)
    }

    return ElementArray.fromAsyncCallback(async () => {
        const strategyRef: CustomStrategyReference = { strategy, strategyName, strategyArguments }
        let res = await this.execute(strategy, ...strategyArguments)

        /**
         * if the user's script return just one element
         * then we convert it to an array as this method
         * should return multiple elements
         */
        if (!Array.isArray(res)) {
            res = [res]
        }

        res = res.filter(el => !!el && typeof el[ELEMENT_KEY] === 'string')

        return res.length ? await getElements.call(this, strategyRef, res) : [] as WebdriverIO.Element[]
    }, {
        selector: strategyName,
        parent: this
    })
}
