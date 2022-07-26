import { ELEMENT_KEY } from '../../constants.js'
import { getBrowserObject } from '../../utils/index.js'

/**
 *
 * Scroll element into viewport ([MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView)).
 *
 * <example>
    :scrollIntoView.js
    it('should demonstrate the scrollIntoView command', async () => {
        const elem = await $('#myElement');
        // scroll to specific element
        await elem.scrollIntoView();
    });
 * </example>
 *
 * @alias element.scrollIntoView
 * @param {object|boolean=} scrollIntoViewOptions  options for `Element.scrollIntoView()` (default: `true`)
 * @uses protocol/execute
 * @type utility
 *
 */
export default function scrollIntoView (
    this: WebdriverIO.Element,
    scrollIntoViewOptions: boolean | ScrollIntoViewOptions = true
) {
    const browser = getBrowserObject(this)
    return browser.execute(/* istanbul ignore next */function scrollIntoView (elem: HTMLElement, options: boolean | ScrollIntoViewOptions) {
        elem.scrollIntoView(options)
    }, {
        [ELEMENT_KEY]: this.elementId, // w3c compatible
        ELEMENT: this.elementId // jsonwp compatible
    } as any as HTMLElement, scrollIntoViewOptions)
}
