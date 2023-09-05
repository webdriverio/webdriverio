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
    let [windowX, windowY] = await browser.execute(() => [
        window.scrollX, window.scrollY
    ])
    const origScrollX = windowX
    const origScrollY = windowY
    const origin = windowX === 0 && windowY === 0 ? this : undefined

    windowX = elemRect.x <= viewport.width ? elemRect.x - 10 : viewport.width / 2
    windowY = elemRect.y <= viewport.height ? elemRect.y - 10 : viewport.height / 2

    const deltaByOption = {
        start: { y: elemRect.y, x: elemRect.x },
        center: { y: elemRect.y - Math.round((viewport.height - elemRect.height) / 2), x: elemRect.x - Math.round((viewport.width - elemRect.width) / 2) },
        end: { y: elemRect.y - (viewport.height - elemRect.height - 20), x: elemRect.x - (viewport.width - elemRect.width) }
    }
    let [deltaX, deltaY] = [deltaByOption.start.x, deltaByOption.start.y]
    if (options && typeof options !== 'boolean') {
        const { block, inline } = options
        if (block === 'nearest') {
            const nearestDistance = Math.min(...Object.values(deltaByOption).map(delta => Math.abs(delta.y)))
            deltaY = Object.values(deltaByOption).find(delta => Math.abs(delta.y) === nearestDistance)!.y
        } else if (block) {
            deltaY = deltaByOption[block].y
        }
        if (inline === 'nearest') {
            const nearestDistance = Math.min(...Object.values(deltaByOption).map(delta => Math.abs(delta.x)))
            deltaX = Object.values(deltaByOption).find(delta => Math.abs(delta.x) === nearestDistance)!.x
        } else if (inline) {
            deltaX = deltaByOption[inline].x
        }
    }

    if (origin) {
        deltaX = deltaX > viewport.width ? Math.round(viewport.width - elemRect.width - (elemRect.width / 2) - 30) : Math.round(deltaX)
        deltaY = deltaY > viewport.height ? Math.round(viewport.height - elemRect.height - (elemRect.height / 2) - 30) : Math.round(deltaY)

        windowX = 0
        windowY = 0
    } else {
        deltaX = Math.round(deltaX - origScrollX)
        deltaY = Math.round(deltaY - origScrollY)

        windowX = Math.round(windowX)
        windowY = Math.round(windowY)
    }

    try {
        return await browser.action('wheel')
            .scroll({ duration: 200, x: windowX, y: windowY, deltaX, deltaY, origin })
            .perform()
    } catch (err: any) {
        log.warn(
            `Failed to execute "scrollIntoView" using WebDriver Actions API: ${err.message}!\n` +
            'Re-attempting using `Element.scrollIntoView` via Web API.'
        )
        return scrollIntoViewWeb.call(this, options)
    }
}
