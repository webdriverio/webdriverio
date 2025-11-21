import logger from '@wdio/logger'
import { ELEMENT_KEY } from 'webdriver'

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
    const browserName = String((browser.capabilities as WebdriverIO.Capabilities)?.browserName || '').toLowerCase()
    if (browserName.includes('firefox')) {
        try {
            const isInViewport = await browser.execute(
                (elem: HTMLElement) => {
                    const rect = elem.getBoundingClientRect()
                    const vh = window.innerHeight || document.documentElement.clientHeight
                    const vw = window.innerWidth || document.documentElement.clientWidth
                    if (rect.width <= 0 || rect.height <= 0) {
                        return false
                    }
                    if (rect.bottom <= 0 || rect.right <= 0 || rect.top >= vh || rect.left >= vw) {
                        return false
                    }

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
                    [ELEMENT_KEY]: element.elementId,
                    ELEMENT: element.elementId,
                } as unknown as HTMLElement
            )
            if (!isInViewport) {
                await element.scrollIntoView({ block: 'center', inline: 'center' })
            }
        } catch {
            // ignore errors during visibility check
        }
    }
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
    try {
        return await clickNested()
    } catch {
        await workaround(element)
        return clickNested()
    }
}
