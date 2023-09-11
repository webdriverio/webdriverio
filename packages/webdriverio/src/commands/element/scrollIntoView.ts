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

    /**
     * by default the WebDriver action scrolls the element just into the
     * viewport. In order to stay complaint with `Element.scrollIntoView()`
     * we need to adjust the values a bit.
     */
    const elemRect = await browser.getElementRect(this.elementId)
    const viewport = await browser.getWindowSize()
    let [scrollX, scrollY] = await browser.execute(() => [
        window.scrollX, window.scrollY
    ])

    // handle elements outside of the viewport
    scrollX = elemRect.x <= viewport.width ? elemRect.x : viewport.width / 2
    scrollY = elemRect.y <= viewport.height ? elemRect.y : viewport.height / 2

    const deltaByOption = {
        start: { y: elemRect.y - elemRect.height, x: elemRect.x - elemRect.width },
        center: { y: elemRect.y - Math.round((viewport.height - elemRect.height) / 2), x: elemRect.x - Math.round((viewport.width - elemRect.width) / 2) },
        end: { y: elemRect.y - (viewport.height - elemRect.height), x: elemRect.x - (viewport.width - elemRect.width) }
    }

    let [deltaX, deltaY] = [deltaByOption.start.x, deltaByOption.start.y]
    if (options === true) {
        options = { block: 'start', inline: 'nearest' }
    }
    if (options === false) {
        options = { block: 'end', inline: 'nearest' }
    }
    if (options && typeof options === 'object') {
        const { block, inline } = options
        if (block === 'nearest') {
            const nearestYDistance = Math.min(...Object.values(deltaByOption).map(delta => delta.y))
            deltaY = Object.values(deltaByOption).find(delta => delta.y === nearestYDistance)!.y
        } else if (block) {
            deltaY = deltaByOption[block].y
        }
        if (inline === 'nearest') {
            const nearestXDistance = Math.min(...Object.values(deltaByOption).map(delta => delta.x))
            deltaX = Object.values(deltaByOption).find(delta => delta.x === nearestXDistance)!.x
        } else if (inline) {
            deltaX = deltaByOption[inline].x
        }
    }

    // take into account the current scroll position
    deltaX = Math.round(deltaX - scrollX)
    deltaY = Math.round(deltaY - scrollY)

    try {
        return await browser.action('wheel')
            .scroll({ duration: 0, x: deltaX, deltaY, origin: this })
            .perform()
    } catch (err: any) {
        log.warn(
            `Failed to execute "scrollIntoView" using WebDriver Actions API: ${err.message}!\n` +
            'Re-attempting using `Element.scrollIntoView` via Web API.'
        )
        return scrollIntoViewWeb.call(this, options)
    }
}
