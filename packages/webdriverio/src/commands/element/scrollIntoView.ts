import logger from '@wdio/logger'
import { ELEMENT_KEY } from 'webdriver'

import { getBrowserObject } from '@wdio/utils'
import type { CustomScrollIntoViewOptions, MobileScrollIntoViewOptions } from 'src/types.js'

const log = logger('webdriverio')

type MobileScrollUntilVisibleOptions = {
    element: WebdriverIO.Element;
    maxScrolls: number;
    scrollDirection: MobileScrollDirection;
    scrollableElement: WebdriverIO.Element | null;
};

async function getScrollableElement({
    browser,
    options
}: {
    browser: WebdriverIO.Browser,
    options?: MobileScrollIntoViewOptions
}): Promise<WebdriverIO.Element | null> {
    if (options?.scrollableElement) {
        return options?.scrollableElement
    }
    const defaultAndroidSelector = '//android.widget.ScrollView'
    const defaultIosSelector = '-ios predicate string:type == "XCUIElementTypeApplication"'
    const selector = browser.isAndroid
        ? // There is always a scrollview for Android or, if this fails we should throw an error
        defaultAndroidSelector
        : // For iOS, we need to find the application element, if we can't find it, we should throw an error
        defaultIosSelector
    // Not sure why we need to do this, but it seems to be necessary
    const scrollableElements = (await $$(
        selector
    )) as unknown as WebdriverIO.Element[]

    if (scrollableElements.length > 0) {
        return scrollableElements[0]
    }

    throw new Error(
        `Default scrollable element "${browser.isAndroid ? defaultAndroidSelector : defaultIosSelector}" not found.`
    )
}

async function mobileScrollUntilVisible({
    element,
    scrollableElement,
    maxScrolls,
    scrollDirection,
}: MobileScrollUntilVisibleOptions): Promise<boolean> {
    let isVisible = false
    let scrolls = 0

    while (!isVisible && scrolls < maxScrolls) {
        try {
            isVisible = await element.isDisplayed()
        } catch {
            isVisible = false
        }

        if (isVisible) {break}

        if (browser.isAndroid) {
            await browser.execute('mobile: scrollGesture', {
                elementId: scrollableElement?.elementId,
                direction: scrollDirection,
                percent: 0.5,
            })
        } else if (browser.isIOS) {
            await browser.execute('mobile: scroll', {
                elementId: scrollableElement?.elementId,
                direction: scrollDirection,
            })
        }

        scrolls++
    }

    return isVisible
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
        direction: MobileScrollDirection.Down,
        maxScrolls: 10,
    }
    const mobileOptions = {
        ...defaultOptions,
        ...((options as CustomScrollIntoViewOptions)?.mobileOptions || {}),
    }
    const scrollableElement = await getScrollableElement({ browser, options: mobileOptions })
    const isVisible = await mobileScrollUntilVisible({
        element,
        maxScrolls: mobileOptions.maxScrolls,
        scrollDirection: mobileOptions.direction,
        scrollableElement,
    })

    if (isVisible) {
        // Pause for stabilization
        return browser.pause(1000)
    }
    throw new Error('Element not found within scroll limit')

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
        } as any as HTMLElement,
        options,
    )
}

export enum MobileScrollDirection {
    Down = 'down',
    Up = 'up',
    Left = 'left',
    Right = 'right',
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
 * @param {object|boolean=} CustomScrollIntoViewOptions  options for `Element.scrollIntoView()` (default: `{ block: 'start', inline: 'nearest' }`)
 * @uses protocol/execute
 * @type utility
 *
 */
export async function scrollIntoView (
    this: WebdriverIO.Element,
    options: CustomScrollIntoViewOptions | boolean = { block: 'start', inline: 'nearest' }
) {
    const browser = getBrowserObject(this)

    /**
     * Appium does not support the "wheel" action
     */
    if (browser.isMobile) {
        if (await browser.getContext() === 'NATIVE_APP') {
            return nativeMobileScrollIntoView({
                browser,
                element: this,
                options: (options as CustomScrollIntoViewOptions)?.mobileOptions || {}
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

        await browser.action('wheel')
            .scroll({ duration: 0, x: deltaX, y: deltaY, origin: this })
            .perform()
    } catch (err: any) {
        log.warn(
            `Failed to execute "scrollIntoView" using WebDriver Actions API: ${err.message}!\n` +
            'Re-attempting using `Element.scrollIntoView` via Web API.'
        )
        await scrollIntoViewWeb.call(this, options)
    }
}
