import fs from 'fs'
import type { ElementReference } from '@wdio/protocols'

import { getElement } from '../../utils/getElementObject'
import { waitToLoadReact, react$ as react$Script } from '../../scripts/resq'
import type { ReactSelectorOptions } from '../../types'

const resqScript = fs.readFileSync(require.resolve('resq'))

/**
 *
 * The `react$` command is a useful command to query React Components by their
 * actual name and filter them by props and state.
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
        const appWrapper = browser.$('div#root')

        browser.react$('t', {
            props: { name: '7' }
        }).click()
        browser.react$('t', {
            props: { name: 'x' }
        }).click()
        browser.react$('t', {
            props: { name: '6' }
        }).click()
        browser.react$('t', {
            props: { name: '=' }
        }).click()

        console.log($('.component-display').getText()); // prints "42"
    });
 * </example>
 *
 * @alias react$
 * @param {String}  selector        of React component
 * @param {ReactSelectorOptions=}                    options         React selector options
 * @param {Object=}                                  options.props   React props the element should contain
 * @param {Array<any>|number|string|object|boolean=} options.state  React state the element should be in
 * @return {Element}
 *
 */
export default async function react$(
    this: WebdriverIO.Element,
    selector: string,
    { props = {}, state = {} }: ReactSelectorOptions = {}
) {
    await this.executeScript(resqScript.toString(), [])
    await this.execute(waitToLoadReact)
    const res = await this.execute(
        react$Script, selector, props, state, this
    ) as ElementReference

    return getElement.call(this, selector, res, true)
}
