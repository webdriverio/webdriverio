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
const VERIFY_TOLERANCE_PX = 1

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

    // normalized up front (not inside the `try`) so a mid-flight failure still
    // falls back using the options the caller actually passed, not `true`/`false`
    if (options === true) {
        options = { block: 'start', inline: 'nearest' }
    }
    if (options === false) {
        options = { block: 'end', inline: 'nearest' }
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
        const measure = async () => browser.execute((elem: HTMLElement) => {
            const { left, top, width, height } = elem.getBoundingClientRect()
            // ground truth for "is this actually visible right now", independent of any
            // window-bounds arithmetic: is the element really the thing painted at its
            // own center point? This correctly accounts for clipping by a nested scroll
            // container *and* for occlusion by an unrelated overlapping element (a fixed
            // header/footer, a sticky toolbar) - things pure geometry against
            // `window.innerWidth/Height` can't see. Point can legitimately be outside the
            // current viewport (that's still "not painted", which is the right answer),
            // so this never throws.
            //
            // `(Document|ShadowRoot).elementsFromPoint()` does NOT pierce into an open
            // shadow root on its own - it stops at the shadow host - so for an element
            // nested inside one or more shadow roots (the exact scenario this whole
            // command exists to handle) it would never find it. Recurse into each hit's
            // own `.shadowRoot.elementsFromPoint()` until the hit stack stops bottoming
            // out on a shadow host.
            let isPainted = false
            try {
                const cx = left + width / 2
                const cy = top + height / 2
                const deepElementsFromPoint = (root: Document | ShadowRoot): Element[] => {
                    const hits = root.elementsFromPoint(cx, cy)
                    const topHit = hits[0] as (Element & { shadowRoot?: ShadowRoot | null }) | undefined
                    return topHit?.shadowRoot ? deepElementsFromPoint(topHit.shadowRoot) : hits
                }
                isPainted = deepElementsFromPoint(document).includes(elem)
            } catch { /* keep isPainted: false */ }
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
                },
                isPainted
            }
        }, {
            [ELEMENT_KEY]: this.elementId, // w3c compatible
            ELEMENT: this.elementId, // jsonwp compatible
        } as unknown as HTMLElement)

        /**
         * Whether the element is already fully (or, for an element bigger than the
         * viewport, at least as fully as possible) visible on each axis - used both to
         * implement "nearest" alignment and, after a scroll attempt, as the success bar
         * (not exact-target-match: unreachable inside a small nested container). A
         * small tolerance absorbs subpixel `getBoundingClientRect` rounding.
         */
        const getVisibility = ({ elemRect, viewport, scroll: { x: windowScrollX, y: windowScrollY } }: Awaited<ReturnType<typeof measure>>) => {
            const TOL = VERIFY_TOLERANCE_PX
            const isVisibleY = elemRect.y >= windowScrollY - TOL && elemRect.y + elemRect.height <= windowScrollY + viewport.height + TOL
            const isVisibleX = elemRect.x >= windowScrollX - TOL && elemRect.x + elemRect.width <= windowScrollX + viewport.width + TOL
            const spansViewportY = elemRect.y <= windowScrollY + TOL && elemRect.y + elemRect.height >= windowScrollY + viewport.height - TOL
            const spansViewportX = elemRect.x <= windowScrollX + TOL && elemRect.x + elemRect.width >= windowScrollX + viewport.width - TOL
            return {
                y: isVisibleY || spansViewportY,
                x: isVisibleX || spansViewportX
            }
        }

        /**
         * Given a measurement, compute the deltaX/deltaY needed to reach the
         * requested block/inline alignment relative to the *top-level* viewport.
         */
        const computeDelta = (measurement: Awaited<ReturnType<typeof measure>>) => {
            const { elemRect, viewport, scroll: { x: windowScrollX, y: windowScrollY } } = measurement
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
            if (options && typeof options === 'object') {
                const { block, inline } = options
                const isVisible = getVisibility(measurement)

                if (block === 'nearest') {
                    if (isVisible.y) {
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
                    if (isVisible.x) {
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
            return {
                deltaX: Math.round(deltaX - windowScrollX),
                deltaY: Math.round(deltaY - windowScrollY)
            }
        }

        const initialMeasurement = await measure()
        const initialDelta = computeDelta(initialMeasurement)

        // element is already positioned as requested, nothing to scroll - but only trust
        // that when it's actually painted there. For "nearest" alignment, `computeDelta`
        // itself decides an axis needs no delta using the same window-bounds arithmetic
        // that can't see clipping/occlusion (see `isPainted` below); trusting a zero delta
        // alone here would skip the probe *and* the fallback entirely for a genuinely
        // clipped element, doing nothing at all.
        if (initialMeasurement.isPainted && initialDelta.deltaX === 0 && initialDelta.deltaY === 0) {
            return
        }

        const wheelScroll = (deltaX: number, deltaY: number) => browser.action('wheel')
            .scroll({ duration: 0, x: 0, y: 0, deltaX, deltaY, origin: this })
            .perform()

        /**
         * Per the WebDriver spec, resolving an element `origin` requires the browser to
         * scroll that element into view first (natively, via the same machinery as
         * `Element.scrollIntoView()`), before the wheel deltas below are even applied.
         * That's exactly what nested/Shadow DOM scrolling needs - a wheel event
         * dispatched at a manually-computed page coordinate only hits whatever is
         * actually painted there, which for a clipped element is nothing - but it means
         * the deltas we already computed (against the *pre*-scroll position) would be
         * applied on top of wherever that pre-scroll landed, overshooting.
         *
         * If the element is already visible, that pre-scroll is a no-op, so applying
         * `initialDelta` directly in one wheel action is safe and cheaper. Only pay for
         * a throwaway zero-delta probe (to let the pre-scroll happen in isolation) and a
         * re-measured delta when the element actually starts off-screen/clipped.
         *
         * "Already visible" is judged by `isPainted` (a real hit-test at the element's
         * own center point), not window-bounds arithmetic: an element can have a layout
         * rect that's fully inside the window and still be invisible - clipped by a
         * nested scroll container, or covered by an unrelated overlapping element - and
         * geometry alone can't tell the difference. Trusting geometry here would let the
         * fast path skip the probe for a genuinely-clipped element, hitting exactly the
         * overshoot this whole probe exists to avoid.
         */
        if (initialMeasurement.isPainted) {
            await wheelScroll(initialDelta.deltaX, initialDelta.deltaY)
        } else {
            await wheelScroll(0, 0)
            const remainingDelta = computeDelta(await measure())
            if (remainingDelta.deltaX !== 0 || remainingDelta.deltaY !== 0) {
                await wheelScroll(remainingDelta.deltaX, remainingDelta.deltaY)
            }
        }

        /**
         * real browsers apply wheel-driven scrolling asynchronously (e.g. inertial
         * scrolling), so the element's position may not reflect its final resting place
         * right after the action resolves. Wait until it stops changing across
         * consecutive animation frames instead of assuming it's done.
         *
         * Tracks the element's own `getBoundingClientRect()`, not `window.scrollX/Y`:
         * a nested-container scroll never touches the window's own scroll position, so
         * polling only that would report "settled" immediately (nothing to compare
         * against ever changes) while the container's own inertial scroll is still
         * animating underneath.
         */
        // `execute` doesn't await promises under the classic WebDriver protocol, only Bidi,
        // so `executeAsync` is still required here to reliably wait under both protocols
        // @ts-ignore `executeAsync` is deprecated in favor of `execute`, see comment above
        await browser.executeAsync((elem: HTMLElement, done: () => void) => {
            try {
                let last = elem.getBoundingClientRect()
                let stableFrames = 0
                let totalFrames = 0
                const maxFrames = 60

                const check = () => {
                    totalFrames++
                    const current = elem.getBoundingClientRect()
                    if (current.top === last.top && current.left === last.left) {
                        stableFrames++
                    } else {
                        stableFrames = 0
                        last = current
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
        }, {
            [ELEMENT_KEY]: this.elementId, // w3c compatible
            ELEMENT: this.elementId, // jsonwp compatible
        } as unknown as HTMLElement)

        /**
         * Not every WebDriver implementation performs the element-origin pre-scroll
         * above the same way (e.g. geckodriver resolves the origin from the element's
         * un-scrolled position and, unlike throwing when that's off-screen, silently
         * dispatches in place when it happens to still be in-bounds - no exception to
         * catch). Verify the outcome instead of trusting it, using the same `isPainted`
         * ground truth as the fast-path decision above - not window-bounds arithmetic,
         * which can't tell "visible" from "clipped by a nested container" or "covered
         * by an unrelated overlapping element", and not an exact match against the
         * requested alignment either, since that can be unreachable inside a small
         * nested container even when the element is correctly, fully visible.
         */
        const finalMeasurement = await measure()

        if (!finalMeasurement.isPainted) {
            log.warn(
                'scrollIntoView via the WebDriver Actions API did not bring the element into view! ' +
                'Re-attempting using `Element.scrollIntoView` via Web API.'
            )
            await scrollIntoViewWeb.call(this, options)
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
