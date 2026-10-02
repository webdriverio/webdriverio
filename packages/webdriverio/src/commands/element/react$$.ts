import { getBrowserObject } from '@wdio/utils'
import type { ElementReference } from '@wdio/protocols'

import { resqScript } from '../constant.js'
import { getElements } from '../../utils/getElementObject.js'
import { ElementArray } from '../../element/array.js'
import { waitToLoadReact, react$$ as react$$Script } from '../../scripts/resq.js'
import type { ReactSelectorOptions } from '../../types.js'

/**
 *
 * The `react$$` command is a useful command to query multiple React Components
 * by their actual name and filter them by props and state. It returns a
 * [`WebdriverIO.ElementArray`](/docs/api/browser/$$), the same list as [`$$`](/docs/api/browser/$$).
 *
 * :::info
 *
 * The command works with applications using React v16 to v19, with `createRoot` or
 * `ReactDOM.render`. Read more about React selectors in the
 * [Selectors](/docs/selectors#react-selectors) guide.
 *
 * :::
 *
 * <example>
    :pause.js
    it('should calculate 7 * 6', async () => {
        await browser.url('https://ahfarmer.github.io/calculator/');

        const orangeButtons = await browser.react$$('t', {
            props: { orange: true }
        })
        console.log(await orangeButtons.map((btn) => btn.getText()));
        // prints "[ '÷', 'x', '-', '+', '=' ]"
    });
 * </example>
 *
 * @alias react$$
 * @param {string}  selector        of React component
 * @param {ReactSelectorOptions=}                    options         React selector options
 * @param {Object=}                                  options.props   React props the element should contain
 * @param {`Array<any>|number|string|object|boolean`=} options.state  React state the element should be in
 * @return {WebdriverIO.ElementArray}
 *
 */
export function react$$(
    this: WebdriverIO.Element,
    selector: string,
    { props = {}, state = {} }: ReactSelectorOptions = {}
): WebdriverIO.ElementArray {
    return ElementArray.fromAsyncCallback(async () => {
        const browser = await getBrowserObject(this)
        await this.executeScript(resqScript.toString(), [])
        await browser.execute(waitToLoadReact)
        const res = await browser.execute(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            react$$Script as any, selector, props, state, this
        ) as ElementReference[]

        return getElements.call(this, selector, res, { isReactElement: true })
    }, {
        selector,
        foundWith: 'react$$',
        parent: this,
        /**
         * the arguments after the selector, so that
         * `parent[foundWith](selector, ...props)` runs the same query again
         */
        props: [{ props, state }]
    })
}
