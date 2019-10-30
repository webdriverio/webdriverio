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
import { ELEMENT_KEY } from '../../constants'

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

    /**
     * if the user's script return just one element
     * then we convert it to an array as this method
     * should return multiple elements
     */
    if (!Array.isArray(res)) {
        res = [res]
    }

    res = res.filter(el => !!el && typeof el[ELEMENT_KEY] === 'string')

    return res.length ? await getElements.call(this, strategy, res) : []
}

export default custom$$
