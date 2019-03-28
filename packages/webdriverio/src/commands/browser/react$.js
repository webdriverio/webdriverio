/**
 *
 * Select React Composite Component or HTML Element based on passed selector
 * API Reference: https://github.com/baruchvlz/resq#usage
 *
 * <example>
    :react$.js
    it('should get component', () => {
        const browser = await remote({
            // options
        })
        await browser.url('http://my-react-app.abc')

        // Assuming you have a <MyComponent /> JSX element in your application
        expect(await browser.react$('MyComponent')).toMatchObject({
            node: null,
            children: [],
            state: {},
            props: {},
            isFragment: false
        })
    });
 * </example>
 *
 * @alias browser.react$
 * @param {String} Element to find in Virtual DOM
 * @param {Object} Optional configuration for resq library
 * @return {Object} ReactSelectorQueryNode provided by the resq library
 * @type utility
 *
 */

import { resq$, waitToLoadReact } from 'resq'

export default async function react$(selector, options = {}) {
    await waitToLoadReact(options.timeout, options.rootElement)

    return resq$(selector)
}
