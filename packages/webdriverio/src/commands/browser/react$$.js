/**
 *
 * The `react$$` command is a useful command to query multiple React Components
 * by their actual name and filter them by props and state.
 *
 * **NOTE:** the command only works with applications using React v16.x
 *
 * <example>
    :pause.js
    it('should calculate 7 * 6', () => {
        browser.url('https://ahfarmer.github.io/calculator/');

        const orangeButtons = browser.react$$('t', {
            props: { orange: true }
        })
        console.log(orangeButtons.map((btn) => btn.getText())); // prints "[ '÷', 'x', '-', '+', '=' ]"
    });
 * </example>
 *
 * @alias browser.react$$
 * @param {String}  selector        of React component
 * @param {ReactSelectorOptions=}                    options         React selector options
 * @param {Object=}                                  options.props   React props the element should contain
 * @param {Array<any>|number|string|object|boolean=} options.state  React state the element should be in
 * @return {ElementArray}
 *
 */
import fs from 'fs'
import { enhanceElementsArray } from '../../utils'
import { getElements } from '../../utils/getElementObject'
import { waitToLoadReact, react$$ as react$$Script } from '../../scripts/resq'

const resqScript = fs.readFileSync(require.resolve('resq'))

export default async function react$$ (selector, { props = {}, state = {} } = {}) {
    await this.executeScript(resqScript.toString(), [])
    await this.execute(waitToLoadReact)
    const res = await this.execute(react$$Script, selector, props, state)

    const elements = await getElements.call(this, selector, res, true)
    return enhanceElementsArray(elements, this, selector, 'react$$', [props, state])
}
