/**
 *
 * The `customs$` allows you to use a custom strategy declared by using `browser.addLocatorStrategy`
 *
 * <example>
    :pause.js
    it('should get all the plugin wrapper buttons', () => {
        browser.url('https://webdriver.io');
        browser.addLocatorStrategy('myStrat', (selector) => {
            return document.querySelectorAll(selector)
        })

        const pluginRowBlock = browser.custom$('myStrat', '.pluginRowBlock')
        const pluginWrapper = pluginRowBlock.custom$$('myStrat', '.pluginWrapper')

        console.log(pluginWrapper.length) // 4
    });
 * </example>
 *
 * @alias custom$$
 * @param {String} strategyName
 * @param {Any} strategyArguments
 * @return {Element}
 */
import { getElements } from '../../utils/getElementObject'
import { getBrowserObject } from '../../utils'

async function custom$$ (strategyName, strategyArguments) {
    const browserObject = getBrowserObject(this)
    const strategy = browserObject.strategies.get(strategyName)

    if (!strategy) {
        throw Error('No strategy found for ' + strategyName)
    }

    let parent

    if (this.elementId) {
        switch(this.constructor.name) {
        case 'Element':
            parent = this
            break
        case 'Browser':
        default:
            parent = browserObject.$('html')
            break
        }
    }

    let res = await this.execute(strategy, strategyArguments, parent)

    if (!Array.isArray(res)) {
        res = [res]
    }

    return await getElements.call(this, strategy, res)
}

export default custom$$
