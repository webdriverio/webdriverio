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
 * :::info
 *
 * On Desktop/Mobile Web, browsers apply wheel-driven scrolling asynchronously, so this command
 * waits until the scroll position stops changing before resolving. This ensures the element is
 * actually in its final position by the time subsequent commands run.
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
export async function scrollIntoView (
    this: WebdriverIO.Element,
    options: CustomScrollIntoViewOptions | boolean = { block: 'start', inline: 'nearest' }
): Promise<void|unknown> {
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
         * viewport. In order to stay compliant with `Element.scrollIntoView()`
         * we need to adjust the values a bit.
         *
         * Fetch element rect, viewport size, and current scroll in one execute
         * round-trip instead of three protocol calls.
         */
        const {
            elemRect,
            viewport,
            scroll: { x: windowScrollX, y: windowScrollY }
        } = await browser.execute((elem: HTMLElement) => {
            const { left, top, width, height } = elem.getBoundingClientRect()
            return {
                elemRect: {
                    x: left + window.scrollX,
                    y: top + window.scrollY,
                    width,
                    height
                },
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                scroll: {
                    x: window.scrollX,
                    y: window.scrollY
                }
            }
        }, {
            [ELEMENT_KEY]: this.elementId, // w3c compatible
            ELEMENT: this.elementId, // jsonwp compatible
        } as unknown as HTMLElement)

        /**
         * Target document scroll positions for MDN-like block/inline alignment.
         * Wheel scroll uses deltaX/deltaY (amount to scroll), not x/y (aim point).
         */
        const targetByOption = {
            start: { y: elemRect.y, x: elemRect.x },
            center: {
                y: elemRect.y - (viewport.height - elemRect.height) / 2,
                x: elemRect.x - (viewport.width - elemRect.width) / 2
            },
            end: {
                y: elemRect.y - (viewport.height - elemRect.height),
                x: elemRect.x - (viewport.width - elemRect.width)
            }
        }

        let [deltaX, deltaY] = [targetByOption.start.x, targetByOption.start.y]
        if (options === true) {
            options = { block: 'start', inline: 'nearest' }
        }
        if (options === false) {
            options = { block: 'end', inline: 'nearest' }
        }
        if (options && typeof options === 'object') {
            const { block, inline } = options
            const isVisibleY = elemRect.y >= windowScrollY && elemRect.y + elemRect.height <= windowScrollY + viewport.height
            const isVisibleX = elemRect.x >= windowScrollX && elemRect.x + elemRect.width <= windowScrollX + viewport.width
            const spansViewportY = elemRect.y <= windowScrollY && elemRect.y + elemRect.height >= windowScrollY + viewport.height
            const spansViewportX = elemRect.x <= windowScrollX && elemRect.x + elemRect.width >= windowScrollX + viewport.width

            if (block === 'nearest') {
                if (isVisibleY || spansViewportY) {
                    // already sufficiently visible on this axis, don't move it
                    deltaY = windowScrollY
                } else {
                    const nearestYDistance = Math.min(...Object.values(targetByOption).map(delta => Math.abs(delta.y - windowScrollY)))
                    deltaY = Object.values(targetByOption).find(delta => Math.abs(delta.y - windowScrollY) === nearestYDistance)!.y
                }
            } else if (block) {
                deltaY = targetByOption[block].y
            }
            if (inline === 'nearest') {
                if (isVisibleX || spansViewportX) {
                    // already sufficiently visible on this axis, don't move it
                    deltaX = windowScrollX
                } else {
                    const nearestXDistance = Math.min(...Object.values(targetByOption).map(delta => Math.abs(delta.x - windowScrollX)))
                    deltaX = Object.values(targetByOption).find(delta => Math.abs(delta.x - windowScrollX) === nearestXDistance)!.x
                }
            } else if (inline) {
                deltaX = targetByOption[inline].x
            }
        }

        // scroll by the difference between target and current window scroll
        deltaX = Math.round(deltaX - windowScrollX)
        deltaY = Math.round(deltaY - windowScrollY)

        // element is already positioned as requested, nothing to scroll
        if (deltaX === 0 && deltaY === 0) {
            return
        }

        /**
         * per the WebDriver spec, an element `origin` must be scrolled into view before its
         * coordinates can be resolved - which would silently reposition the page before our
         * own deltaX/deltaY are applied. Our deltas are already absolute, computed relative to
         * the current window scroll, so we scroll from the viewport origin instead.
         */
        await browser.action('wheel')
            .scroll({
                duration: 0,
                x: 0,
                y: 0,
                deltaX,
                deltaY,
            })
            .perform()

        /**
         * real browsers apply wheel-driven scrolling asynchronously (e.g. inertial
         * scrolling), so `window.scrollX/Y` may not reflect the final position right
         * after the action resolves. Wait until the scroll position stops changing
         * across consecutive animation frames instead of assuming it's done.
         */
        // `execute` doesn't await promises under the classic WebDriver protocol, only Bidi,
        // so `executeAsync` is still required here to reliably wait under both protocols
        // @ts-ignore `executeAsync` is deprecated in favor of `execute`, see comment above
        await browser.executeAsync((done: () => void) => {
            try {
                let lastX = window.scrollX
                let lastY = window.scrollY
                let stableFrames = 0
                let totalFrames = 0
                const maxFrames = 60

                const check = () => {
                    totalFrames++
                    const x = window.scrollX
                    const y = window.scrollY
                    if (x === lastX && y === lastY) {
                        stableFrames++
                    } else {
                        stableFrames = 0
                        lastX = x
                        lastY = y
                    }
                    if (stableFrames >= 2 || totalFrames >= maxFrames) {
                        return done()
                    }
                    requestAnimationFrame(check)
                }
                requestAnimationFrame(check)
            } catch {
                done()
            }
        })
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
}: MobileScrollUntilVisibleOptions): Promise<{ hasScrolled: boolean; isVisible: boolean;  }> {
    let isVisible = false
    let hasScrolled = false
    let scrolls = 0

    while (!isVisible && scrolls < maxScrolls) {
        try {
            isVisible = await element.isDisplayed()
        } catch {
            isVisible = false
        }

        if (isVisible) {break}

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
        } as unknown as HTMLElement,
        options,
    )
}
