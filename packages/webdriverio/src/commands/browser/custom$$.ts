import { enhanceElementsArray } from '../../utils/index.js'
import { getElements } from '../../utils/getElementObject.js'
import { ELEMENT_KEY } from '../../constants.js'
import type { ElementArray, CustomStrategyFunction, CustomStrategyReference } from '../../types.js'

/**
 *
 * The `customs$$` allows you to use a custom strategy declared by using `browser.addLocatorStrategy`
 *
 * <example>
    :example.js
    it('should get all the plugin wrapper buttons', async () => {
        await browser.url('https://webdriver.io')
        await browser.addLocatorStrategy('myStrat', (selector) => {
            return document.querySelectorAll(selector)
        })

        const pluginWrapper = await browser.custom$$('myStrat', '.pluginWrapper')

        console.log(await pluginWrapper.length) // 4
    })
 * </example>
 *
 * @alias custom$$
 * @param {String} strategyName
 * @param {Any} strategyArguments
 * @return {ElementArray}
 */
export async function custom$$ (
    this: WebdriverIO.Browser,
    strategyName: string,
    ...strategyArguments: any[]
): Promise<ElementArray> {
    const strategy = this.strategies.get(strategyName) as CustomStrategyFunction

    if (!strategy) {
        throw Error('No strategy found for ' + strategyName)
    }

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

    const elements = res.length ? await getElements.call(this, strategyRef, res) : [] as any as ElementArray
    return enhanceElementsArray(elements, this, strategyName, 'custom$$', strategyArguments)
}
