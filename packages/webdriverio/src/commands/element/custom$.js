/**
 *
 * The `custom$` allows you to use a custom strategy declared by using `browser.addLocatorStrategy`
 *
 * <example>
    :pause.js
    it('should fetch the project title', () => {
        browser.url('https://webdriver.io');
        browser.addLocatorStrategy('myStrat', (selector) => {
            return document.querySelectorAll(selector)
        })

        const header = browser.custom$('myStrat', 'header')
        const projectTitle = header.custom$('myStrat', '.projectTitle')

        console.log(projectTitle.getText()) // WEBDRIVER I/O
    });
 * </example>
 *
 * @alias custom$
 * @param {String} strategyName
 * @param {Any} strategyArguments
 * @return {Element}
 */
import { getElement } from '../../utils/getElementObject'
import { getBrowserObject } from '../../utils'

async function custom$ (strategyName, strategyArguments) {
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

    if (Array.isArray(res)) {
        res = res[0]
    }

    return await getElement.call(this, strategy, res)
}

export default custom$
