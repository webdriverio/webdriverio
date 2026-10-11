import logger from '@wdio/logger'

import { getBrowserObject } from '@wdio/utils'
import { buttonValue } from '../../utils/actions/index.js'

import type { ClickOptions } from '../../types.js'

const log = logger('webdriver')
/**
 *
 * Click on an element.
 *
 * This issues a WebDriver `click` command for the selected element , which generally scrolls to and then clicks the
 * selected element when no options are passed. When options object is passed it uses action class instead of webdriver click which
 * give added capabilities like passing button type, coordinates etc. By default, when using options a release action
 * command is send after performing the click action, pass `option.skipRelease=true` to skip this action.
 * Before the actions, when the pointer would not hit the element at its center (it is outside the window, hidden by a
 * scroll container or covered by a fixed header or footer), the element is scrolled into view, then to the center
 * if it is still covered. An element that the pointer already hits is not scrolled.
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
 * - scroll it just into view ("nearest"), and check again
 * - still missed, for example under a fixed header or footer: scroll it to the center
 * An element without a box (`display: none`) is left to the driver, which throws.
 *
 * The page scrolls the element itself (`Element.scrollIntoView()`), not with the
 * `scrollIntoView` command: its wheel actions release the keys and buttons that the
 * test holds, so a Shift-click would become a plain click.
 */
async function bringIntoView(browser: WebdriverIO.Browser, element: WebdriverIO.Element, offset: { x: number, y: number }) {
    try {
        for (const scroll of [null, { block: 'nearest', inline: 'nearest' }, { block: 'center', inline: 'center' }] as const) {
            if (await hitAtCenter(browser, element, scroll, offset) !== 'missed') {
                return
            }
        }
    } catch (err) {
        log.debug(`Could not scroll the element into view before the click: ${(err as Error).message}`)
    }
}

/**
 * Scrolls the element with `scroll` (if given, without a smooth animation), then
 * hit-tests the in-view center point of the element, computed as in the WebDriver
 * spec (the first client rect, clipped by the viewport only), or the click point
 * (center plus offset) when it is on the element. The pointer hits the element when
 * the top element at that point is the element or one of its descendants, also
 * inside shadow roots.
 */
function hitAtCenter(
    browser: WebdriverIO.Browser,
    element: WebdriverIO.Element,
    scroll: ScrollIntoViewOptions | null,
    offset: { x: number, y: number }
): Promise<'hit' | 'missed' | 'no-box'> {
    return browser.execute((elem: HTMLElement, scroll: ScrollIntoViewOptions | null, offset: { x: number, y: number }) => {
        if (scroll) {
            elem.scrollIntoView({ ...scroll, behavior: 'instant' })
        }
        const rect = elem.getClientRects()[0]
        if (!rect) {
            return 'no-box' as const
        }
        const left = Math.max(0, Math.min(rect.x, rect.x + rect.width))
        const right = Math.min(window.innerWidth, Math.max(rect.x, rect.x + rect.width))
        const top = Math.max(0, Math.min(rect.y, rect.y + rect.height))
        const bottom = Math.min(window.innerHeight, Math.max(rect.y, rect.y + rect.height))
        let x = Math.floor((left + right) / 2)
        let y = Math.floor((top + bottom) / 2)
        if (x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight) {
            return 'missed' as const
        }
        if (offset.x || offset.y) {
            if (x !== Math.floor(rect.x + rect.width / 2) || y !== Math.floor(rect.y + rect.height / 2)) {
                return 'missed' as const
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
                return 'hit' as const
            }
        }
        return 'missed' as const
    }, element as unknown as HTMLElement, scroll, offset)
}

async function elementClick(element: WebdriverIO.Element) {
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
        if (!err.message.includes('element click intercepted')) {
            // we only apply the workaround when the click got intercepted
            // so that the middleware can handle any other errors
            throw err
        }
        await workaround(element)
        return element.elementClick(element.elementId)
    }
}

async function actionClick(element: WebdriverIO.Element, options: Partial<ClickOptions>) {
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

    const browser = getBrowserObject(element) as WebdriverIO.Browser
    if (x || y) {
        const { width, height } = await browser.getElementRect(element.elementId)
        if ((x && x < (-Math.floor(width / 2))) || (x && x > Math.floor(width / 2))) {
            log.warn('x would cause a out of bounds error as it goes outside of element')
        }
        if ((y && y < (-Math.floor(height / 2))) || (y && y > Math.floor(height / 2))) {
            log.warn('y would cause a out of bounds error as it goes outside of element')
        }
    }
    const clickNested = async () => {
        await browser.action('pointer', {
            parameters: { pointerType: browser.isMobile ? 'touch' : 'mouse' }
        })
            .move({ origin: element, x, y })
            .down({ button })
            .pause(duration)
            .up({ button })
            .perform(skipRelease)
    }
    const isNativeApp = browser.isMobile && (await browser.isNativeContext || browser.isWindowsApp || browser.isMacApp)
    if (!isNativeApp) {
        await bringIntoView(browser, element, { x, y })
    }
    try {
        return await clickNested()
    } catch {
        await workaround(element)
        return clickNested()
    }
}
