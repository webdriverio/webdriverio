import { custom$$ as custom$$Browser } from '../browser/custom$$.js'

/**
 *
 * The `custom$` allows you to use a custom strategy declared by using `browser.addLocatorStrategy`.
 * Read more on custom selector stratgies in the [Selector docs](../../selectors#custom-selector-strategies).
 *
 * <example>
    :example.js
    it('should fetch the project title', async () => {
        const context = await browser.url('https://webdriver.io')
        browser.addLocatorStrategy('myStrat', (selector) => {
            return document.querySelectorAll(selector)
        })

        const projectTitle = await context.custom$('myStrat', '.projectTitle')
        console.log(await projectTitle.getText()) // WEBDRIVER I/O
    })
 * </example>
 *
 * @alias custom$
 * @param {string} strategyName
 * @param {*} strategyArguments
 * @return {WebdriverIO.Element}
 */
export const custom$$ = custom$$Browser