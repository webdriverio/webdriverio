import type { ElementReference } from '@wdio/protocols'

import { resqScript } from '../constant.js'
import { getElement } from '../../utils/getElementObject.js'
import { waitToLoadReact, react$ as react$Script } from '../../scripts/resq.js'
import type { ReactSelectorOptions } from '../../types.js'

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
    it('should calculate 7 * 6', async () => {
        await browser.url('https://ahfarmer.github.io/calculator/');
        const appWrapper = await $('div#root')

        await browser.react$('t', {
            props: { name: '7' }
        }).click()
        await browser.react$('t', {
            props: { name: 'x' }
        }).click()
        await browser.react$('t', {
            props: { name: '6' }
        }).click()
        await browser.react$('t', {
            props: { name: '=' }
        }).click()

        console.log(await $('.component-display').getText()); // prints "42"
    });
 * </example>
 *
 * @alias browser.react$
 * @param {string}  selector        of React component
 * @param {ReactSelectorOptions=}                    options         React selector options
 * @param {Object=}                                  options.props   React props the element should contain
 * @param {`Array<any>|number|string|object|boolean`=} options.state  React state the element should be in
 * @return {WebdriverIO.Element}
 *
 */
export async function react$ (
    this: WebdriverIO.Browser,
    selector: string,
    { props = {}, state = {} }: ReactSelectorOptions = {}
) {
    await this.executeScript(resqScript.toString(), [])
    await this.execute(waitToLoadReact)
    const res = await this.execute(
        react$Script, selector, props, state
    ) as unknown as ElementReference

    return getElement.call(this, selector, res, { isReactElement: true })
}
