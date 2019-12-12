/**
 *
 * The `react$` command is a useful command to query React Components by their
 * actual name and filter them by props and state.
 *
 * **NOTE:** the command only works with applications using React v16.x
 *
 * <example>
    :pause.js
    it('should calculate 7 * 6', () => {
        browser.url('https://ahfarmer.github.io/calculator/');
        const appWrapper = browser.$('div#root')

        appWrapper.react$('t', { name: '7' }).click()
        appWrapper.react$('t', { name: 'x' }).click()
        appWrapper.react$('t', { name: '6' }).click()
        appWrapper.react$('t', { name: '=' }).click()

        console.log($('.component-display').getText()); // prints "42"
    });
 * </example>
 *
 * @alias react$
 * @param {String} selector of React component
 * @param {Object=} props  React props the element should contain
 * @param {Array<any>|number|string|object|boolean=} state  React state the element should be in
 * @return {Element}
 *
 */
import fs from 'fs'
import { getElement } from '../../utils/getElementObject'
import { waitToLoadReact, react$ as react$Script } from '../../scripts/resq'

const resqScript = fs.readFileSync(require.resolve('resq'))

export default async function react$(selector, props = {}, state = {}) {
    await this.executeScript(resqScript.toString(), [])
    await this.execute(waitToLoadReact)
    const res = await this.execute(react$Script, selector, props, state, this)

    return getElement.call(this, selector, res, true)
}
