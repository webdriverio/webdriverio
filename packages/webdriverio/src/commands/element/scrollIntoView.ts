import logger from '@wdio/logger'
import { ELEMENT_KEY } from 'webdriver'

import { getBrowserObject } from '@wdio/utils'
import type { ChainablePromiseElement, CustomScrollIntoViewOptions, MobileScrollIntoViewOptions } from '../../types.js'
import { MobileScrollDirection } from '../../types.js'

const log = logger('webdriverio')

/**
 *
 * Scroll element into viewport for Desktop/Mobile Web <strong>AND</strong> Mobile Native Apps.
 *
 * :::info
 *
 * Scrolling for Mobile Native Apps is done based on the mobile `swipe` command.
 *
 * :::
 *
 * <example>
    :desktop.mobile.web.scrollIntoView.js
    it('should demonstrate the desktop/mobile web scrollIntoView command', async () => {
        const elem = await $('#myElement');
        // scroll to specific element
        await elem.scrollIntoView();
        // center element within the viewport
        await elem.scrollIntoView({ block: 'center', inline: 'center' });
    });
 * </example>
 *
 * <example>
    :mobile.native.app.scrollIntoView.js
    it('should demonstrate the mobile native app scrollIntoView command', async () => {
        const elem = await $('#myElement');
        // scroll to a specific element in the default scrollable element for Android or iOS for a maximum of 10 scrolls
        await elem.scrollIntoView();
        // Scroll to the left in the scrollable element called '#scrollable' for a maximum of 5 scrolls
        await elem.scrollIntoView({
            direction: 'left',
            maxScrolls: 5,
            scrollableElement: $('#scrollable')
        });
    });
 * </example>
 *
 * @alias element.scrollIntoView
 * @param {object|boolean=} options                   options for `Element.scrollIntoView()`. Default for desktop/mobile web: <br/> `{ block: 'start', inline: 'nearest' }` <br /> Default for Mobile Native App <br /> `{ maxScrolls: 10, scrollDirection: 'down' }`
 * @rowInfo Desktop/Mobile Web Only
 * @param {string=}         options.behavior          See [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView). <br /><strong>WEB-ONLY</strong> (Desktop/Mobile)
 * @param {string=}         options.block             See [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView). <br /><strong>WEB-ONLY</strong> (Desktop/Mobile)
 * @param {string=}         options.inline            See [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView). <br /><strong>WEB-ONLY</strong> (Desktop/Mobile)
 * @rowInfo Mobile Native App Only
 * @param {string=}         options.direction         Can be one of `down`, `up`, `left` or `right`, default is `up`. <br /><strong>MOBILE-NATIVE-APP-ONLY</strong>
 * @param {number=}         options.maxScrolls        The max amount of scrolls until it will stop searching for the element, default is `10`. <br /><strong>MOBILE-NATIVE-APP-ONLY</strong>
 * @param {number=}         options.duration          The duration in milliseconds for the swipe. Default is `1500` ms. The lower the value, the faster the swipe.<br /><strong>MOBILE-NATIVE-APP-ONLY</strong>
 * @param {Element=}        options.scrollableElement Element that is used to scroll within. If no element is provided it will use the following selector for iOS `-ios predicate string:type == "XCUIElementTypeApplication"` and the following for Android `//android.widget.ScrollView'`. If more elements match the default selector, then by default it will pick the first matching element. <br /> <strong>MOBILE-NATIVE-APP-ONLY</strong>
 * @param {number=}         options.percent           The percentage of the (default) scrollable element to swipe. This is a value between 0 and 1. Default is `0.95`.<br /><strong>NEVER</strong> swipe from the exact top|bottom|left|right of the screen, you might trigger for example the notification bar or other OS/App features which can lead to unexpected results.<br /> <strong>MOBILE-NATIVE-APP-ONLY</strong>
 * @uses protocol/execute
 * @type utility
 *
 */
export async function scrollIntoView(
    this: WebdriverIO.Element,
    options: CustomScrollIntoViewOptions | boolean = { block: 'start', inline: 'nearest' }
): Promise<void | unknown> {
    const browser = getBrowserObject(this)

    /**
     * Appium does not support the "wheel" action
     */
    if (browser.isMobile) {
        if (await browser.isNativeContext) {
            return nativeMobileScrollIntoView({
                browser,
                element: this,
                options: (options as CustomScrollIntoViewOptions) || {}
            })
        }

        return scrollIntoViewWeb.call(this, options)
    }

    try {
        /**
         * by default the WebDriver action scrolls the element just into the
         * viewport. In order to stay complaint with `Element.scrollIntoView()`
         * we need to adjust the values a bit.
         */
        const elemRect = await browser.getElementRect(this.elementId)
        const viewport = await browser.getWindowSize()
        const [currentScrollX, currentScrollY] = await browser.execute(() => [
            window.scrollX, window.scrollY
        ])

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
        deltaX = Math.round(deltaX - currentScrollX)
        deltaY = Math.round(deltaY - currentScrollY)

        const hasFloat = [
            viewport.height, viewport.width,
            elemRect.x, elemRect.y, elemRect.height, elemRect.width
        ].some((v) => !Number.isInteger(v))
        const isOutside = (elemRect.x > viewport.width) || (elemRect.y > viewport.height)

        if (!hasFloat && !isOutside) {
            const mapY = {
                start: -elemRect.height,
                center: -Math.round((viewport.height - elemRect.height) / 2),
                end: -(viewport.height - elemRect.height)
            } as const
            const mapX = {
                start: -elemRect.width,
                center: -Math.round((viewport.width - elemRect.width) / 2),
                end: -(viewport.width - elemRect.width)
            } as const

            let x = mapX.end
            let y = mapY.start

            if (options && typeof options === 'object') {
                const { block, inline } = options
                if (block && block !== 'nearest') {
                    y = mapY[block]
                }
                if (inline && inline !== 'nearest') {
                    x = mapX[inline]
                }
            }

            await browser.action('wheel')
                .scroll({ duration: 0, deltaX: 0, deltaY: 0, x, y, origin: this })
                .perform()
        } else {
            await browser.action('wheel')
                .scroll({ duration: 0, deltaX, deltaY, origin: this })
                .perform()
        }
        const browserName = String((browser.capabilities as WebdriverIO.Capabilities)?.browserName || '').toLowerCase()
        if (browserName.includes('firefox')) {
            const isInViewport = await browser.execute(
                (elem: HTMLElement) => {
                    const rect = elem.getBoundingClientRect()
                    const vh = window.innerHeight || document.documentElement.clientHeight
                    const vw = window.innerWidth || document.documentElement.clientWidth
                    if (rect.width <= 0 || rect.height <= 0) { return false }
                    if (rect.bottom <= 0 || rect.right <= 0 || rect.top >= vh || rect.left >= vw) { return false }

                    let parent: HTMLElement | null = elem.parentElement
                    while (parent && parent !== document.body) {
                        const style = window.getComputedStyle(parent)
                        const overflowX = style.overflowX
                        const overflowY = style.overflowY
                        if (style.overflow !== 'visible' || overflowX !== 'visible' || overflowY !== 'visible') {
                            const pr = parent.getBoundingClientRect()
                            if (rect.right <= pr.left || rect.left >= pr.right || rect.bottom <= pr.top || rect.top >= pr.bottom) {
                                return false
                            }
                        }
                        parent = parent.parentElement
                    }
                    return true
                },
                {
                    [ELEMENT_KEY]: this.elementId,
                    ELEMENT: this.elementId,
                } as unknown as HTMLElement
            )

            if (!isInViewport) {
                if (options && typeof options === 'object') {
                    const { block, inline } = options
                    await scrollIntoViewWeb.call(this, {
                        block: block || 'center',
                        inline: inline || 'center'
                    })
                } else {
                    await scrollIntoViewWeb.call(this, { block: 'center', inline: 'center' })
                }
            }
        }
    } catch (err) {
        log.warn(
            `Failed to execute "scrollIntoView" using WebDriver Actions API: ${(err as Error).message}!\n` +
            'Re-attempting using `Element.scrollIntoView` via Web API.'
        )
        await scrollIntoViewWeb.call(this, options)
    }
}

type MobileScrollUntilVisibleOptions = {
    browser: WebdriverIO.Browser;
    element: WebdriverIO.Element;
    maxScrolls: number;
    direction: `${MobileScrollDirection}`;
    scrollableElement?: WebdriverIO.Element | ChainablePromiseElement | null;
    duration?: number;
    percent?: number;
}

async function mobileScrollUntilVisible({
    browser,
    direction,
    duration,
    element,
    maxScrolls,
    percent,
    scrollableElement,
}: MobileScrollUntilVisibleOptions): Promise<{ hasScrolled: boolean; isVisible: boolean; }> {
    let isVisible = false
    let hasScrolled = false
    let scrolls = 0

    while (!isVisible && scrolls < maxScrolls) {
        try {
            isVisible = await element.isDisplayed()
        } catch {
            isVisible = false
        }

        if (isVisible) { break }

        await browser.swipe({
            direction,
            ...(duration ? { duration } : {}),
            ...(percent ? { percent } : {}),
            ...(scrollableElement ? { scrollableElement } : {}),
        })
        hasScrolled = true

        scrolls++
    }

    return { hasScrolled, isVisible }
}

async function nativeMobileScrollIntoView({
    browser,
    element,
    options
}: {
    browser: WebdriverIO.Browser,
    element: WebdriverIO.Element,
    options: MobileScrollIntoViewOptions
}) {
    const defaultOptions = {
        maxScrolls: 10,
        direction: MobileScrollDirection.Up,
    }
    const mobileOptions = {
        ...defaultOptions,
        ...(options || {}),
    }
    const { hasScrolled, isVisible } = await mobileScrollUntilVisible({
        browser,
        element,
        maxScrolls: mobileOptions.maxScrolls,
        direction: mobileOptions.direction,
        ...(mobileOptions?.duration ? { duration: mobileOptions.duration } : {}),
        ...(mobileOptions?.percent ? { percent: mobileOptions.percent } : {}),
        ...(mobileOptions?.scrollableElement ? { scrollableElement: mobileOptions.scrollableElement } : {}),
    })

    if (hasScrolled && isVisible) {
        // Pause for stabilization
        // eslint-disable-next-line wdio/no-pause
        return browser.pause(1000)
    } else if (isVisible) {
        // Element is already visible
        return
    }

    throw new Error(`Element not found within scroll limit of ${mobileOptions.maxScrolls} scrolls by scrolling "${mobileOptions.direction}". ` +
        `Are you sure the element is within the scrollable element or the direction is correct? You can change the scrollable element or direction like this:

await elem.scrollIntoView({
    direction: 'left' // possible options are: 'up|down|left|right'
    scrollableElement: $('#scrollable'),
});

        `)
}

function scrollIntoViewWeb(
    this: WebdriverIO.Element,
    options: ScrollIntoViewOptions | boolean = { block: 'start', inline: 'nearest' }
) {
    const browser = getBrowserObject(this)
    return browser.execute(
        (elem: HTMLElement, options: ScrollIntoViewOptions | boolean) => elem.scrollIntoView(options),
        {
            [ELEMENT_KEY]: this.elementId, // w3c compatible
            ELEMENT: this.elementId, // jsonwp compatible
        } as unknown as HTMLElement,
        options,
    )
}
