import { getBrowserObject } from '../../utils/index.js'
import { buttonValue } from '../../utils/actions/index.js'
import type { ClickOptions } from '../../types.js'

/**
 *
 * Click on an element.
 *
 * This issues a WebDriver `click` command for the selected element , which generally scrolls to and then clicks the
 * selected element when no options are passed. When options object is passed it uses action class instead of webdriver click which
 * give added capabilities like passing button type, coordinates etc. By default, when using options a release action
 * command is send after performing the click action, pass `option.skipRelease=true` to skip this action.
 *
 * Note: If you have fixed-position elements (such as a fixed header or footer) that cover up the
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
 * @alias element.click
 * @uses protocol/element, protocol/elementIdClick, protocol/performActions, protocol/positionClick
 * @type action
 * @param {ClickOptions=}     options        click options (optional)
 * @param {string= | number=} options.button can be one of [0, "left", 1, "middle", 2, "right"] (optional)
 * @param {number=}           options.x      Number (optional)
 * @param {number=}           options.y      Number (optional)
 * @param {number=}           options.skipRelease         Boolean (optional)
 */
export async function click(
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
        return element.elementClick(element.elementId)
    } catch {
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
    }

    const { button, x, y, skipRelease }: ClickOptions = { ...defaultOptions, ...options }

    if (
        typeof x !== 'number'
        || typeof y !== 'number'
        || !Number.isInteger(x)
        || !Number.isInteger(y)
    ) {
        throw TypeError('Coordinates must be integers')
    }

    if (!buttonValue.includes(button)) {
        throw Error('Button type not supported.')
    }

    const browser = getBrowserObject(element)
    if (x || y) {
        const { width, height } = await browser.getElementRect(element.elementId)
        if ((x && x < (-Math.floor(width / 2))) || (x && x > Math.floor(width / 2))) {
            throw Error(`{ x: ${x} } would cause an out of bounds error as it goes outside of element`)
        }
        if ((y && y < (-Math.floor(height / 2))) || (y && y > Math.floor(height / 2))) {
            throw Error(`{ y: ${y} } would cause an out of bounds error as it goes outside of element`)
        }
    }
    const clickNested = async () => {
        await browser.action('pointer', {
            parameters: { pointerType: 'mouse' }
        })
            .move({ origin: element, x, y })
            .down({ button })
            .up({ button })
            .perform(skipRelease)
    }
    try {
        // this is the alternative click behaviour when we pass in an options object
        return clickNested()
    } catch {
        await workaround(element)
        return clickNested()
    }
}