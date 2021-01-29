import fs from 'fs'
import type { ElementReference } from '@wdio/protocols'

import { enhanceElementsArray } from '../../utils'
import { getElements } from '../../utils/getElementObject'
import { waitToLoadReact, react$$ as react$$Script } from '../../scripts/resq'
import type { ReactSelectorOptions } from '../../types'

const resqScript = fs.readFileSync(require.resolve('resq'))

/**
 *
 * The `react$$` command is a useful command to query multiple React Components
 * by their actual name and filter them by props and state.
 *
 * :::info
 *
 * The command only works with applications using React v16.x. Read more about React
 * selectors in the [Selectors](/docs/selectors#react-selectors) guide.
 *
 * :::
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
 * @alias react$$
 * @param {String}  selector        of React component
 * @param {ReactSelectorOptions=}                    options         React selector options
 * @param {Object=}                                  options.props   React props the element should contain
 * @param {Array<any>|number|string|object|boolean=} options.state  React state the element should be in
 * @return {ElementArray}
 *
 */
export default async function react$$(
    this: WebdriverIO.Element,
    selector: string,
    { props = {}, state = {} }: ReactSelectorOptions = {}
) {
    await this.executeScript(resqScript.toString(), [])
    await this.execute(waitToLoadReact)
    const res = await this.execute(
        react$$Script as any, selector, props, state, this
    ) as ElementReference[]

    const elements = await getElements.call(this, selector, res, true)
    return enhanceElementsArray(elements, this, selector, 'react$$', [props, state])
}
