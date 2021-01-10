import { ElementReference } from '@wdio/protocols'

import { getElements } from '../../utils/getElementObject'
import { getBrowserObject, enhanceElementsArray } from '../../utils'
import { ELEMENT_KEY } from '../../constants'
import type { Element, ElementArray } from '../../types'

/**
 *
 * The `customs$$` allows you to use a custom strategy declared by using `browser.addLocatorStrategy`
 *
 * <example>
    :example.js
    it('should get all the plugin wrapper buttons', () => {
        browser.url('https://webdriver.io')
        browser.addLocatorStrategy('myStrat', (selector) => {
            return document.querySelectorAll(selector)
        })

        const pluginRowBlock = browser.custom$('myStrat', '.pluginRowBlock')
        const pluginWrapper = pluginRowBlock.custom$$('myStrat', '.pluginWrapper')

        console.log(pluginWrapper.length) // 4
    })
 * </example>
 *
 * @alias custom$$
 * @param {String} strategyName
 * @param {Any} strategyArguments
 * @return {ElementArray}
 */
async function custom$$ (
    this: Element,
    strategyName: string,
    strategyArguments: string
) {
    const browserObject = getBrowserObject(this)
    const strategy = browserObject.strategies.get(strategyName) as () => ElementReference[]

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

    let res = await this.execute(strategy, strategyArguments, this) as ElementReference[]

    /**
     * if the user's script return just one element
     * then we convert it to an array as this method
     * should return multiple elements
     */
    if (!Array.isArray(res)) {
        res = [res]
    }

    res = res.filter((el) => !!el && typeof el[ELEMENT_KEY] === 'string')

    const elements = res.length ? await getElements.call(this, strategy, res) : [] as any as ElementArray
    return enhanceElementsArray(elements, this, strategyName, 'custom$$', [strategyArguments])
}

export default custom$$
