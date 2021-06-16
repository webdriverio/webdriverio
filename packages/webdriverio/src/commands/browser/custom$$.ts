import { ElementReference } from '@wdio/protocols'
import { enhanceElementsArray } from '../../utils'
import { getElements } from '../../utils/getElementObject'
import { ELEMENT_KEY } from '../../constants'
import type { ElementArray } from '../../types'

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
export default async function custom$$ (
    this: WebdriverIO.Browser,
    strategyName: string,
    ...strategyArguments: any[]
): Promise<ElementArray> {
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

    const elements = res.length ? await getElements.call(this, strategy, res) : [] as any as ElementArray
    return enhanceElementsArray(elements, this, strategy, 'custom$$', [strategyArguments])
}
