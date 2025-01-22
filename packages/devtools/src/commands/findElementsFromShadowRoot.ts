import findElementsFromElement from './findElementsFromElement.js'
import type DevToolsDriver from '../devtoolsdriver.js'

/**
 * The Find Elements command is used to find elements within the shadow root of an
 * element that can be used for future commands. This command returns array of JSON
 * representation of the elements that can be passed to $ command to transform the
 * reference to an extended WebdriverIO element (See findElement).
 *
 * @alias browser.findElementsFromShadowRoot
 * @see https://w3c.github.io/webdriver/#find-elements-from-shadow-root
 * @param {string} using  a valid element location strategy
 * @param {string} value  the actual selector that will be used to find an element
 * @return {object[]}     A (possibly empty) JSON list of representations of an element object, e.g. `{ 'element-6066-11e4-a52e-4f735466cecf': 'ELEMENT_1' }`.
 */
export default async function findElementsFromShadowRoot (
    this: DevToolsDriver,
    { shadowId, using, value }: { shadowId: string, using: string, value: string }
) {
    if (using !== 'css selector') {
        throw new Error('Fetching elements from a shadow element using something other than "css selector" is currently not supported.')
    }

    return findElementsFromElement.call(this, {
        elementId: shadowId,
        using: 'shadow',
        value
    })
}
