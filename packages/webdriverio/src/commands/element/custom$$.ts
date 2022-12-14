import { getElements } from '../../utils/getElementObject.js'
import { getBrowserObject, enhanceElementsArray } from '../../utils/index.js'
import { ELEMENT_KEY } from '../../constants.js'
import type { ElementArray, CustomStrategyFunction } from '../../types.js'

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

        const pluginRowBlock = await browser.custom$('myStrat', '.pluginRowBlock')
        const pluginWrapper = await pluginRowBlock.custom$$('myStrat', '.pluginWrapper')

        console.log(pluginWrapper.length) // 4
    })
 * </example>
 *
 * @alias custom$$
 * @param {String} strategyName
 * @param {Any} strategyArguments
 * @return {ElementArray}
 */
export async function custom$$ (
    this: WebdriverIO.Element,
    strategyName: string,
    ...strategyArguments: any[]
): Promise<ElementArray> {
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

    const elements = res.length ? await getElements.call(this, strategyRef, res) : [] as any as ElementArray
    return enhanceElementsArray(elements, this, strategyName, 'custom$$', strategyArguments)
}
