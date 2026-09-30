import { getWdioKind } from '@wdio/utils'
import type { ElementReference } from '@wdio/protocols'

import type { ChainablePromiseElement } from '../../types.js'

/**
 * Switch the Classic session into a frame.
 *
 * In a WebDriver BiDi session this command throws. Hold the browsing context
 * from `browser.url()` or `browser.newWindow()` and call `context.frame()`.
 * `context.parent` is the frame you came from. There is no `switchFrame(null)`.
 *
 * In a Classic session, pass an element or `null` for the top frame. A string
 * or a function is rejected.
 *
 * <example>
    :switchFrame.js
    // Classic
    await browser.switchFrame($('iframe'))
    await browser.switchFrame(null)

    // BiDi
    const page = await browser.url('https://example.com')
    const child = await page.frame('iframe')
    console.log(await child.getTitle())
 * </example>
 *
 * @alias browser.switchFrame
 * @param {Element|null} context  frame element, or `null` for the top frame (Classic only)
 * @return {Promise<string|void>}
 */
export async function switchFrame (
    this: WebdriverIO.Browser,
    context: WebdriverIO.Element | ChainablePromiseElement | string | null | ((tree: unknown) => boolean | Promise<boolean>)
): Promise<string | void> {
    if (this.isBidi) {
        throw new Error(
            '`switchFrame` was removed for WebDriver BiDi sessions in WebdriverIO v10. ' +
            'Call `frame()` on the browsing context returned by `browser.url()` or `browser.newWindow()`.'
        )
    }

    function isPossiblyUnresolvedElement(input: typeof context): input is WebdriverIO.Element | ChainablePromiseElement {
        // an element or a chainable $() both have the kind 'element', see `@wdio/utils` `kind.ts`
        return getWdioKind(input) === 'element'
    }

    if (typeof context === 'function') {
        throw new Error('Cannot use a function to fetch a context in WebDriver Classic')
    }
    if (typeof context === 'string') {
        throw new Error('Cannot use a string to fetch a context in WebDriver Classic')
    }
    if (isPossiblyUnresolvedElement(context)) {
        const element = await context.getElement()
        await element.waitForExist({
            timeoutMsg: `Can't switch to frame with selector ${element.selector} because it doesn't exist`
        })
        return switchToFrame(this, element)
    }
    return switchToFrame(this, context)
}

/**
 * `switchToFrame` stays on the WebDriver client for Classic sessions, but it is
 * not part of the public browser type. `switchFrame` is the user-facing command.
 */
function switchToFrame (browser: WebdriverIO.Browser, frame: ElementReference | number | null) {
    const classicBrowser = browser as WebdriverIO.Browser & {
        switchToFrame: (id: ElementReference | number | null) => Promise<void>
    }
    toggleDisableDeprecationWarning()
    return classicBrowser.switchToFrame(frame).finally(toggleDisableDeprecationWarning)
}

/**
 * Trigger the `DISABLE_WEBDRIVERIO_DEPRECATION_WARNINGS` environment variable
 * only when running within a Node.js environment.
 */
function toggleDisableDeprecationWarning () {
    if (typeof process !== 'undefined' && process.env) {
        process.env.DISABLE_WEBDRIVERIO_DEPRECATION_WARNINGS = process.env.DISABLE_WEBDRIVERIO_DEPRECATION_WARNINGS
            ? undefined
            : 'true'
    }
}
