import type { ElementReference } from '@wdio/protocols'

import { resqScript } from '../constant.js'
import { getElements } from '../../utils/getElementObject.js'
import { ElementArray } from '../../element/array.js'
import { waitToLoadReact, react$$ as react$$Script } from '../../scripts/resq.js'
import type { ReactSelectorOptions } from '../../types.js'

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
 * @alias browser.react$$
 * @param {string}  selector        of React component
 * @param {ReactSelectorOptions=}                    options         React selector options
 * @param {Object=}                                  options.props   React props the element should contain
 * @param {`Array<any>|number|string|object|boolean`=} options.state  React state the element should be in
 * @return {WebdriverIO.ElementArray}
 *
 */
export function react$$ (
    this: WebdriverIO.Browser,
    selector: string,
    { props = {}, state = {} }: ReactSelectorOptions = {}
) {
    return ElementArray.fromAsyncCallback(async () => {
        await this.executeScript(resqScript, [])
        await this.execute(waitToLoadReact)
        const res = await this.execute(
            react$$Script, selector, props, state
        ) as unknown as ElementReference[]

        const elements = await getElements.call(this, selector, res, { isReactElement: true })
        return elements
    }, {
        selector,
        parent: this
    })
}
