import { getBrowserObject } from '@wdio/utils'
import type { ElementReference } from '@wdio/protocols'

import { reactScript } from '../constant.js'
import { getElement } from '../../utils/getElementObject.js'
import { waitToLoadReact, react$ as react$Script } from '../../scripts/react.js'
import type { ReactSelectorOptions } from '../../types.js'

/**
 *
 * The `react$` command is a useful command to query React Components by their
 * actual name and filter them by props and state.
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
        const appWrapper = await browser.$('div#root')

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
 * @alias react$
 * @param {string}  selector        of React component
 * @param {ReactSelectorOptions=}                    options         React selector options
 * @param {Object=}                                  options.props   React props the element should contain
 * @param {`Array<any>|number|string|object|boolean`=} options.state  React state the element should be in
 * @return {WebdriverIO.Element}
 *
 */
export async function react$(
    this: WebdriverIO.Element,
    selector: string,
    { props = {}, state = {} }: ReactSelectorOptions = {}
) {
    const browser = await getBrowserObject(this)
    /**
     * `execute` of the element runs in the context of the element, also in a frame.
     * It gives the element as first argument, which these two scripts do not use.
     */
    await this.execute(reactScript)
    await this.execute(waitToLoadReact)
    const res = await browser.execute(
        react$Script, selector, props, state, this as unknown as HTMLElement
    ) as unknown as ElementReference

    /**
     * `react$` never counts matches itself, so a refetch (implicit wait, stale
     * element) must not suddenly apply the global strict `$` default either
     */
    return getElement.call(this, selector, res, { isReactElement: true, strict: false, reactOptions: { props, state } })
}
