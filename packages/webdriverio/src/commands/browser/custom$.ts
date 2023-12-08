import { getElement } from '../../utils/getElementObject.js'
import { ELEMENT_KEY } from '../../constants.js'
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
        browser.addLocatorStrategy('myStrat', (selector) => {
            return document.querySelectorAll(selector)
        })

        const projectTitle = await browser.custom$('myStrat', '.projectTitle')

        console.log(await projectTitle.getText()) // WEBDRIVER I/O
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
    this: WebdriverIO.Browser,
    strategyName: string,
    ...strategyArguments: any[]
) {
    const strategy = this.strategies.get(strategyName) as CustomStrategyFunction

    if (!strategy) {
        throw Error('No strategy found for ' + strategyName)
    }

    const strategyRef = { strategy, strategyName, strategyArguments }

    let res = await this.execute(strategy, ...strategyArguments)

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
