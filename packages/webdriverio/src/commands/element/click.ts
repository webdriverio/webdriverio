import logger from '@wdio/logger'

import { getBrowserObject, sleep } from '@wdio/utils'
import { bidiAssertClickable, bidiGetRect, isBidiCommandsEnabled } from '../../utils/bidi/elementCommands.js'
import { buttonValue } from '../../utils/actions/index.js'

import type { ClickOptions } from '../../types.js'

const log = logger('webdriver')
// the longest wait in ms for the two animation frames after a scroll
const MAX_FRAME_WAIT = 100
/**
 *
 * Click on an element.
 *
 * This issues a WebDriver `click` command for the selected element , which generally scrolls to and then clicks the
 * selected element when no options are passed. When options object is passed it uses action class instead of webdriver click which
 * give added capabilities like passing button type, coordinates etc. By default, when using options a release action
 * command is send after performing the click action, pass `option.skipRelease=true` to skip this action.
 * Before the actions, when the pointer would not hit the element at its center (it is outside the window, hidden by a
 * scroll container or covered by a fixed header or footer), the element is scrolled to the center of the window and of
 * its scroll containers (to the bottom or the top when something covers it at the center), and the page gets its
 * `scroll` events before the click. An element that the pointer already hits is not scrolled. In Firefox, and in Safari
 * and web views on iOS with Appium, a click without options does the same before the WebDriver `click` command, because
 * geckodriver and Appium scroll and click without giving the page its `scroll` events first. With an Appium XCUITest
 * driver older than 12.18.2, a click on iOS that scrolls waits 100 ms more. When something intercepts a click without
 * options in any browser (for example a sticky header), the element is brought under the pointer in the same way and
 * clicked again.
 *
 * :::info
 *
 * If you have fixed-position elements (such as a fixed header or footer) that cover up the
 * selected element after it is scrolled within the viewport, the click will be issued at the given coordinates, but will
 * be received by your fixed (overlaying) element. In these cased the following error is thrown:
 *
 * ```
 * Element is not clickable at point (x, x). Other element would receive the click: ..."
 * ```
 *
 * To work around this, try to find the overlaying element and remove it via `execute` command so it doesn't interfere
 * the click. You also can try to scroll to the element yourself using `scroll` with an offset appropriate for your
 * scenario.
 *
 * :::
 *
 * :::info
 *
 * The click command can also be used to simulate a long press on a mobile device. This is done by setting the `duration`.
 * See the example below for more information.
 *
 * :::
 *
 * <example>
    :example.html
    <button id="myButton" onclick="document.getElementById('someText').innerHTML='I was clicked'">Click me</button>
    <div id="someText">I was not clicked</div>
    :click.js
    it('should demonstrate the click command', async () => {
        const myButton = await $('#myButton')
        await myButton.click()
        const myText = await $('#someText')
        const text = await myText.getText()
        assert(text === 'I was clicked') // true
    })
    :example.js
    it('should fetch menu links and visit each page', async () => {
        const links = await $$('#menu a')
        await links.forEach(async (link) => {
            await link.click()
        })
    })
 * </example>
 *
 * <example>
    :example.html
    <button id="myButton">Click me</button>
    :example.js
    it('should demonstrate a click using an offset', async () => {
        const myButton = await $('#myButton')
        await myButton.click({ x: 30 }) // clicks 30 horizontal pixels away from location of the button (from center point of element)
    })
 * </example>
 *
 * <example>
    :example.html
    <button id="myButton">Click me</button>
    :example.js
    it('should demonstrate a right click passed as string', async () => {
        const myButton = await $('#myButton')
        await myButton.click({ button: 'right' }) // opens the contextmenu at the location of the button
    })
    it('should demonstrate a right click passed as number while adding an offset', async () => {
        const myButton = await $('#myButton')
        await myButton.click({ button: 2, x: 30, y: 40 }) // opens the contextmenu 30 horizontal and 40 vertical pixels away from location of the button (from the center of element)
    })
    it('should skip sending releaseAction command that cause unexpected alert closure', async () => {
        const myButton = await $('#myButton')
        await myButton.click({ button: 2, x: 30, y: 40, skipRelease:true }) // skips sending releaseActions
    })
 * </example>
 *
 * <example>
    :longpress.example.js
    it('should be able to open the contacts menu on iOS by executing a longPress', async () => {
        const contacts = await $('~Contacts')
        // opens the Contacts menu on iOS where you can quickly create
        // a new contact, edit your home screen, or remove the app
        await contacts.click({ duration: 2000 })
    })
 * </example>
 *
 * @alias element.click
 * @uses protocol/element, protocol/elementIdClick, protocol/performActions, protocol/positionClick
 * @type action
 * @param {ClickOptions=}     options               Click options (optional)
 * @param {string|number=} options.button        Can be one of `[0, "left", 1, "middle", 2, "right"]` <br /><strong>WEB-ONLY</strong> (Desktop/Mobile)
 * @param {number=}           options.x             Clicks X horizontal pixels away from location of the element (from center point of element)<br /><strong>WEB and Native</strong> (Desktop/Mobile)
 * @param {number=}           options.y             Clicks Y vertical pixels away from location of the element (from center point of element)<br /><strong>WEB and Native support</strong> (Desktop/Mobile)
 * @param {boolean=}          options.skipRelease   Boolean (optional) <br /><strong>WEB-ONLY</strong> (Desktop/Mobile)
 * @param {number=}           options.duration      Duration of the click, aka "LongPress" <br /><strong>MOBILE-NATIVE-APP-ONLY</strong> (Mobile)
 */
export function click(
    this: WebdriverIO.Element,
    options?: Partial<ClickOptions>
) {
    if (typeof options !== 'undefined') {
        if (typeof options !== 'object' || Array.isArray(options)) {
            throw new TypeError('Options must be an object')
        }
        return actionClick(this, options)
    }

    const browser = getBrowserObject(this) as WebdriverIO.Browser
    if (isBidiCommandsEnabled(browser)) {
        return actionClick(this, {}, browser)
    }

    return elementClick(this)
}

/**
* Workaround function, because sometimes browser.action().move() flaky and isn't able to scroll pointer to into view
* Moreover the action  with 'nearest' behavior by default where element is aligned at the bottom of its ancestor.
* and could be overlapped. Scroll to center should definitely work even if element was covered with sticky header/footer
*/
async function workaround(element: WebdriverIO.Element) {
    await element.scrollIntoView({ block: 'center', inline: 'center' })
}

/**
 * WebDriver actions don't scroll: the pointer goes to the in-view center point of the
 * element, which only takes the window into account. ChromeDriver scrolls anyway,
 * geckodriver follows the spec, so the click of an element that is inside the window
 * but hidden by a scrollable ancestor landed on that ancestor, without an error.
 * Bring the element under the pointer first, as the Element Click command does:
 * - the pointer already hits the element: don't scroll, the page doesn't move. With an
 *   offset, the window must not clip the element (the offset counts from the center of
 *   the part in the window), and the pointer must hit the element at the click point
 * - missed: scroll it to the center, and check again. At an edge of the window, a fixed
 *   header or footer or a scrollbar can cover it: Safari shows its overlay scrollbar
 *   after a scroll, and that scrollbar takes the click of an element at the bottom edge
 * - still missed, for example under a sticky header or footer that covers the center of
 *   a small scroll container: align it with the bottom ("end"), then with the top
 *   ("start"). "nearest" would not move it: at the center, it is already in view
 * An element without a box (`display: none`) is left to the driver, which throws.
 *
 * After a scroll, the script resolves after two animation frames. The browser fires the
 * `scroll` events of the page before the animation frame callbacks, so the page handles
 * them before the click, as it does for a user. The second frame is for Firefox 156, which
 * rounds a fractional scroll position (the center) one frame later, with one more `scroll`
 * event.
 *
 * All steps run in one `execute`. The page scrolls the element itself
 * (`Element.scrollIntoView()`, without a smooth animation), not with the `scrollIntoView`
 * command: its wheel actions release the keys and buttons that the test holds, so a
 * Shift-click would become a plain click.
 *
 * The hit-test uses the in-view center point of the element, computed as in the WebDriver
 * spec (the first client rect, clipped by the viewport only), or the click point (center
 * plus offset) when it is on the element. The pointer hits the element when the top
 * element at that point is the element or one of its descendants, also inside shadow roots.
 */
async function bringIntoView(browser: WebdriverIO.Browser, element: WebdriverIO.Element, offset: { x: number, y: number }) {
    try {
        const result: unknown = await browser.execute((elem: HTMLElement, offset: { x: number, y: number }, maxFrameWait: number) => {
            const hitTest = () => {
                const rect = elem.getClientRects()[0]
                if (!rect) {
                    return 'no-box'
                }
                const left = Math.max(0, Math.min(rect.x, rect.x + rect.width))
                const right = Math.min(window.innerWidth, Math.max(rect.x, rect.x + rect.width))
                const top = Math.max(0, Math.min(rect.y, rect.y + rect.height))
                const bottom = Math.min(window.innerHeight, Math.max(rect.y, rect.y + rect.height))
                let x = Math.floor((left + right) / 2)
                let y = Math.floor((top + bottom) / 2)
                if (x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight) {
                    return 'missed'
                }
                if (offset.x || offset.y) {
                    if (x !== Math.floor(rect.x + rect.width / 2) || y !== Math.floor(rect.y + rect.height / 2)) {
                        return 'missed'
                    }
                    if (rect.left <= x + offset.x && x + offset.x <= rect.right && rect.top <= y + offset.y && y + offset.y <= rect.bottom) {
                        x += offset.x
                        y += offset.y
                    }
                }
                let hit = document.elementFromPoint(x, y)
                while (hit?.shadowRoot) {
                    const inner = hit.shadowRoot.elementFromPoint(x, y)
                    if (!inner || inner === hit) {
                        break
                    }
                    hit = inner
                }
                for (let node: Node | null = hit; node; node = node.parentNode || (node as ShadowRoot).host || null) {
                    if (node === elem) {
                        return 'hit'
                    }
                }
                return 'missed'
            }
            if (hitTest() !== 'missed') {
                return
            }
            for (const scroll of [
                { block: 'center', inline: 'center' },
                { block: 'end', inline: 'nearest' },
                { block: 'start', inline: 'nearest' }
            ] as const) {
                elem.scrollIntoView({ ...scroll, behavior: 'instant' })
                if (hitTest() !== 'missed') {
                    break
                }
            }
            // a hidden page gets no animation frame
            if (document.visibilityState === 'hidden') {
                return
            }
            return new Promise<void>((resolve) => {
                requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
                setTimeout(resolve, maxFrameWait)
            })
        }, element as unknown as HTMLElement, offset, MAX_FRAME_WAIT)

        /**
         * TODO: remove in the next major version. appium-xcuitest-driver before 12.18.2
         * (appium-remote-debugger before 17.7.3, appium/appium#22978) does not wait for the
         * promise of the script after a scroll: it gives `{}` at once. Wait here instead,
         * as long as the page waits at most.
         */
        if (browser.isIOS && result && typeof result === 'object') {
            await sleep(MAX_FRAME_WAIT)
        }
    } catch (err) {
        log.debug(`Could not scroll the element into view before the click: ${(err as Error).message}`)
    }
}

async function elementClick(element: WebdriverIO.Element) {
    const browser = getBrowserObject(element) as WebdriverIO.Browser
    /**
     * geckodriver scrolls the element into view and clicks it in one step, so the page
     * gets its `scroll` events after the click. ChromeDriver almost always gives the page
     * a frame between the scroll and the click (it missed about 1 click in 300),
     * safaridriver always does. Appium (XCUITest) does the same as geckodriver on iOS
     * (Safari and web views). This costs one more request, so only Firefox and Appium on
     * iOS pay it.
     */
    if (browser.isFirefox || (browser.isMobile && browser.isIOS && !await browser.isNativeContext)) {
        await bringIntoView(browser, element, { x: 0, y: 0 })
    }
    try {
        return await element.elementClick(element.elementId)
    } catch (error) {
        // We will never reach this code in the case of a mobile app, the implicitWait will wait for the element but will throw
        // an error with the following message:
        // `Error: Can't call click on element with selector "<selector>" because element wasn't found at implicitWait`
        // This means that he workaround is not reachable in the case of a mobile app and thus will not automatically scroll the element into view
        let err = error as Error
        if (typeof error === 'string') {
            err = new Error(error)
        }
        /**
         * The error name is the code: "element click intercepted", "click intercepted"
         * in Safari. Only ChromeDriver also puts it in the message, geckodriver says
         * "… obscures it".
         */
        if (!`${err.name} ${err.message}`.includes('click intercepted')) {
            // we only apply the workaround when the click got intercepted
            // so that the middleware can handle any other errors
            throw err
        }
        /**
         * The driver scrolled the element under something, e.g. a sticky header of its
         * scroll container: bring it where the pointer hits it, and click again. The
         * driver does not scroll an element that is in view. This costs nothing when the
         * first click works.
         */
        const isNativeApp = browser.isMobile && (await browser.isNativeContext || browser.isWindowsApp || browser.isMacApp)
        await (isNativeApp ? workaround(element) : bringIntoView(browser, element, { x: 0, y: 0 }))
        return element.elementClick(element.elementId)
    }
}

async function actionClick(
    element: WebdriverIO.Element,
    options: Partial<ClickOptions>,
    bidiBrowser?: WebdriverIO.Browser
) {
    const defaultOptions: ClickOptions = {
        button: 0,
        x: 0,
        y: 0,
        skipRelease: false,
        duration: 0
    }

    const { button, x, y, skipRelease, duration }: ClickOptions = { ...defaultOptions, ...options }

    if (
        typeof x !== 'number'
        || typeof y !== 'number'
        || !Number.isInteger(x)
        || !Number.isInteger(y)
    ) {
        throw new TypeError('Coordinates must be integers')
    }

    if (!buttonValue.includes(button)) {
        throw new Error('Button type not supported.')
    }

    const browser = bidiBrowser ?? getBrowserObject(element) as WebdriverIO.Browser
    if (x || y) {
        const { width, height } = isBidiCommandsEnabled(browser)
            ? await bidiGetRect(element)
            : await browser.getElementRect(element.elementId)
        if ((x && x < (-Math.floor(width / 2))) || (x && x > Math.floor(width / 2))) {
            log.warn('x would cause a out of bounds error as it goes outside of element')
        }
        if ((y && y < (-Math.floor(height / 2))) || (y && y > Math.floor(height / 2))) {
            log.warn('y would cause a out of bounds error as it goes outside of element')
        }
    }
    const isNativeApp = browser.isMobile && (await browser.isNativeContext || browser.isWindowsApp || browser.isMacApp)
    if (!isNativeApp) {
        await bringIntoView(browser, element, { x, y })
    }
    if (bidiBrowser) {
        await bidiAssertClickable(element)
    }
    const moveDuration = bidiBrowser ? { duration: 0 } : {}
    const clickNested = async () => {
        await browser.action('pointer', {
            parameters: { pointerType: browser.isMobile ? 'touch' : 'mouse' }
        })
            .move({ origin: element, x, y, ...moveDuration })
            .down({ button })
            .pause(duration)
            .up({ button })
            .perform(skipRelease)
    }
    try {
        return await clickNested()
    } catch {
        await workaround(element)
        return clickNested()
    }
}
