import { ElementReference } from '@wdio/protocols'
import { enhanceElementsArray } from '../../utils'
import { getElements } from '../../utils/getElementObject'
import { ELEMENT_KEY } from '../../constants'
import type { Browser, MultiRemoteBrowser, ElementArray } from '../../types'

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

        const pluginWrapper = browser.custom$$('myStrat', '.pluginWrapper')

        console.log(pluginWrapper.length) // 4
    })
 * </example>
 *
 * @alias custom$$
 * @param {String} strategyName
 * @param {Any} strategyArguments
 * @return {ElementArray}
 */
export default async function custom$$ (
    this: Browser | MultiRemoteBrowser,
    strategyName: string,
    ...strategyArguments: any[]
) {
    const strategy = this.strategies.get(strategyName)

    if (!strategy) {
        throw Error('No strategy found for ' + strategyName)
    }

    let res: ElementReference | ElementReference[] = await this.execute(
        strategy,
        ...strategyArguments
    )

    /**
     * if the user's script return just one element
     * then we convert it to an array as this method
     * should return multiple elements
     */
    if (!Array.isArray(res)) {
        res = [res]
    }

    res = res.filter(el => !!el && typeof el[ELEMENT_KEY] === 'string')

    const elements = res.length ? await getElements.call(this, strategy.toString(), res) : [] as any as ElementArray
    return enhanceElementsArray(elements, this, strategyName, 'custom$$', [strategyArguments])
}
