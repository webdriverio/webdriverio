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

        const projectTitle = browser.custom$('myStrat', '.projectTitle')

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

async function custom$ (strategyName, strategyArguments) {
    const strategy = this.strategies.get(strategyName)

    if (!strategy) {
        throw Error('No strategy found for ' + strategyName)
    }

    let res = await this.execute(strategy, strategyArguments)

    if (Array.isArray(res)) {
        res = res[0]
    }
    return await getElement.call(this, strategy, res)
}

export default runFnInFiberContext(custom$)
