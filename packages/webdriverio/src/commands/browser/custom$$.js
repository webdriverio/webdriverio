/**
 *
 * The `customs$` allows you to use a custom strategy declared by using `browser.addLocatorStrategy`
 *
 * <example>
    :pause.js
    it('should get all the plugin wrapper buttons', () => {
        browser.url('https://webdriver.io');
        browser.useLocatorStrategy('myStrat', (selector) => {
            return document.querySelectorAll(selector)
        })

        const pluginWrapper = browser.custom$$('.pluginWrapper')

        console.log(pluginWrapper.length) // 4
    });
 * </example>
 *
 * @alias custom$
 * @param {String} strategyName
 * @param {Any} strategyArguments
 * @return {Element}
 */
import { runFnInFiberContext } from '@wdio/utils/build/shim'
import { getElements } from '../../utils/getElementObject'

async function custom$$ (strategyName, strategyArgument) {
    const strategy = this.strategies.get(strategyName)

    if (!strategy) {
        throw Error('No strategy found for ' + strategyName)
    }
    const res = await this.execute(strategy, strategyArgument)

    return await getElements.call(this, strategy, res)
}

export default runFnInFiberContext(custom$$)
