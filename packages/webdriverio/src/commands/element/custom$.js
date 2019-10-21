/**
 *
 * The `custom$` allows you to use a custom strategy declared by using `browser.addLocatorStrategy`
 *
 * <example>
    :pause.js
    it('should fetch the project title', () => {
        browser.url('https://webdriver.io');
        browser.useLocatorStrategy('myStrat', (selector) => {
            return document.querySelectorAll(selector)
        })

        const projectTitle = browser.custom$('.projectTitle')

        console.log(projectTitle.getText()) // WEBDRIVER I/O
    });
 * </example>
 *
 * @alias custom$
 * @param {String} strategyName
 * @param {Any} strategyArguments
 * @return {Element}
 */

import { runFnInFiberContext } from '@wdio/utils/build/shim'
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
        switch(this.parent.constructor.name) {
        case 'Element':
            parent = this.parent
            break
        case 'Browser':
        default:
            parent = browserObject.$('html')
            break
        }
    }

    const res = await this.execute(strategy, strategyArguments, parent)

    return await getElement.call(this, strategy, res)
}

export default runFnInFiberContext(custom$)
