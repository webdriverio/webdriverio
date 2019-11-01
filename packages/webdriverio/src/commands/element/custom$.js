/**
 *
 * The `custom$` allows you to use a custom strategy declared by using `browser.addLocatorStrategy`
 *
 * <example>
    :example.js
    it('should fetch the project title', () => {
        browser.url('https://webdriver.io')
        browser.addLocatorStrategy('myStrat', (selector) => {
            return document.querySelectorAll(selector)
        })

        const header = browser.custom$('myStrat', 'header')
        const projectTitle = header.custom$('myStrat', '.projectTitle')

        console.log(projectTitle.getText()) // WEBDRIVER I/O
    })
 * </example>
 *
 * @alias custom$
 * @param {String} strategyName
 * @param {Any} strategyArguments
 * @return {Element}
 */
import { getElement } from '../../utils/getElementObject'
import { getBrowserObject } from '../../utils'
import { ELEMENT_KEY } from '../../constants'

async function custom$ (strategyName, strategyArguments) {
    const browserObject = getBrowserObject(this)
    const strategy = browserObject.strategies.get(strategyName)

    if (!strategy) {
        throw Error('No strategy found for ' + strategyName)
    }

    /**
     * fail if root element is not found, similar to:
     * $('.notExisting').$('.someElem')
     */
    if (!this.elementId) {
        throw Error(`Can't call custom$ on element with selector "${this.selector}" because element wasn't found`)
    }

    let res = await this.execute(strategy, strategyArguments, this)

    /**
     * if the user's script returns multiple elements
     * then we just return the first one as this method
     * is intended to return just one element
     */
    if (Array.isArray(res)) {
        res = res[0]
    }

    if (res && typeof res[ELEMENT_KEY] === 'string') {
        return await getElement.call(this, strategy, res)
    }

    throw Error('Your locator strategy script must return an element')
}

export default custom$
