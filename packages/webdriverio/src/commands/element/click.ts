import { getBrowserObject } from '../../utils/index.js'
import type { ClickOptions } from '../../types.js'
import type { Button } from '../../utils/actions/index.js'

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
    options?: ClickOptions
) {
    if (typeof options === 'undefined') {
        return this.elementClick(this.elementId)
    }

    if (typeof options !== 'object' || Array.isArray(options)) {
        throw new TypeError('Options must be an object')
    }

    let button = (options.button || 0) as Button
    const {
        x: xOffset = 0,
        y: yOffset = 0,
        skipRelease = false
    } = options || {}

    if (
        typeof xOffset !== 'number'
        || typeof yOffset !== 'number'
        || !Number.isInteger(xOffset)
        || !Number.isInteger(yOffset)) {
        throw new TypeError('Coordinates must be integers')
    }

    if (options.button === 'left') {
        button = 0
    }
    if (options.button === 'middle') {
        button = 1
    }
    if (options.button === 'right') {
        button = 2
    }
    if (![0, 1, 2].includes(button as number)) {
        throw new Error('Button type not supported.')
    }

    if (this.isW3C) {
        const { width, height } = await this.getElementRect(this.elementId)
        if (xOffset < (-Math.floor(width / 2)) && xOffset > Math.floor(width / 2)) {
            throw new Error('xOffset would cause a out of bounds error as it goes outside of element')
        }
        if (yOffset < (-Math.floor(height / 2)) && yOffset > Math.floor(height / 2)) {
            throw new Error('xOffset would cause a out of bounds error as it goes outside of element')
        }
        const browser = getBrowserObject(this)
        const clickNested = async () => {
            await browser.action('pointer', {
                parameters: { pointerType: 'mouse' }
            })
                .move({
                    origin: this,
                    x: xOffset,
                    y: yOffset
                })
                .down({ button })
                .up({ button })
                .perform(skipRelease)
        }
        try {
            await clickNested()
        } catch {
        /**
        * Workaround, because sometimes browser.action().move() flaky and isn't able to scroll pointer to into view
        * Moreover the action  with 'nearest' behavior by default where element is aligned at the bottom of its ancestor.
        * and could be overlapped. Scroll to center should definitely work even if element was covered with sticky header/footer
        */
            await this.scrollIntoView({ block: 'center', inline: 'center' })
            await clickNested()
        }
        return
    }

    const { width, height } = await this.getElementSize(this.elementId)
    await this.moveToElement(this.elementId, xOffset + (width / 2), yOffset + (height / 2))
    return this.positionClick(button as number)
}
