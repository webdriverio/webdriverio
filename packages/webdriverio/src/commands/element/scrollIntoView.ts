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
export default async function scrollIntoView (
    this: WebdriverIO.Element,
    options: ScrollIntoViewOptions | boolean = { block: 'start', inline: 'nearest' }
) {
    const browser = getBrowserObject(this)

    let deltaX = 0
    let deltaY = 0
    /**
     * by default the WebDriver action scrolls the element just into the
     * viewport. In order to stay complaint with `Element.scrollIntoView()`
     * we need to adjust the values a bit.
     */
    if (typeof options === 'boolean' || typeof options.block === 'string' || typeof options.inline === 'string') {
        const htmlElem = await browser.$('html')
        const viewport = await htmlElem.getSize()
        const elemSize = await this.getSize()
        if (options === true || (options as ScrollIntoViewOptions).block === 'start') {
            deltaY += viewport.height - elemSize.height
        } else if ((options as ScrollIntoViewOptions).block === 'center') {
            deltaY += Math.round((viewport.height - elemSize.height) / 2)
        }
        if ((options as ScrollIntoViewOptions).inline === 'start') {
            deltaX += viewport.height - elemSize.height
        } else if ((options as ScrollIntoViewOptions).block === 'center') {
            deltaX += Math.round((viewport.height - elemSize.height) / 2)
        }
    }

    return browser.action('wheel')
        .scroll({ origin: this, duration: 200, deltaY, deltaX })
        .perform()
}
