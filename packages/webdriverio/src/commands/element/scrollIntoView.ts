import logger from '@wdio/logger'

import { ELEMENT_KEY } from '../../constants.js'
import { getBrowserObject } from '../../utils/index.js'

const log = logger('webdriverio')

function scrollIntoViewWeb (
    this: WebdriverIO.Element,
    options: ScrollIntoViewOptions | boolean = { block: 'start', inline: 'nearest' }
) {
    const browser = getBrowserObject(this)
    return browser.execute(
        (elem: HTMLElement, options: ScrollIntoViewOptions | boolean) => elem.scrollIntoView(options),
        {
            [ELEMENT_KEY]: this.elementId, // w3c compatible
            ELEMENT: this.elementId, // jsonwp compatible
        } as any as HTMLElement,
        options,
    )
}

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
        // center element within the viewport
        await elem.scrollIntoView({ block: 'center', inline: 'center' });
    });
 * </example>
 *
 * @alias element.scrollIntoView
 * @param {object|boolean=} scrollIntoViewOptions  options for `Element.scrollIntoView()` (default: `{ block: 'start', inline: 'nearest' }`)
 * @uses protocol/execute
 * @type utility
 *
 */
export async function scrollIntoView (
    this: WebdriverIO.Element,
    options: ScrollIntoViewOptions | boolean = { block: 'start', inline: 'nearest' }
) {
    const browser = getBrowserObject(this)

    /**
     * Appium does not support the "wheel" action
     */
    if (browser.isMobile) {
        return scrollIntoViewWeb.call(this, options)
    }

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

    try {
        return await browser.action('wheel')
            .scroll({ origin: this, duration: 200, deltaY, deltaX })
            .perform()
    } catch (err: any) {
        log.warn(
            `Failed to execute "scrollIntoView" using WebDriver Actions API: ${err.message}!\n` +
            'Re-attempting using `Element.scrollIntoView` via Web API.'
        )
        return scrollIntoViewWeb.call(this, options)
    }
}
