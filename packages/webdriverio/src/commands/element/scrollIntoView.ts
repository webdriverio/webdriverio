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
 * @uses protocol/execute
 * @type utility
 *
 */
export default function scrollIntoView (
    this: WebdriverIO.Element,
) {
    const browser = getBrowserObject(this)
    return browser.action('wheel')
        .scroll({ origin: this, duration: 200 })
        .perform()
}
