import { getBrowserObject } from '../../utils/index.js'

type MoveToOptions = {
    xOffset?: number,
    yOffset?: number,
}

/**
 *
 * Move the mouse by an offset of the specified element. If no element is specified,
 * the move is relative to the current mouse cursor. If an element is provided but
 * no offset, the mouse will be moved to the center of the element. If the element
 * is not visible, it will be scrolled into view.
 *
 * @param {MoveToOptions=} options          moveTo command options
 * @param {Number=}        options.xOffset  X offset to move to, relative to the top-left corner of the element. If not specified, the mouse will move to the middle of the element.
 * @param {Number=}        options.yOffset  Y offset to move to, relative to the top-left corner of the element. If not specified, the mouse will move to the middle of the element.
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidmoveto
 * @type protocol
 */
export async function moveTo (
    this: WebdriverIO.Element,
    { xOffset, yOffset }: MoveToOptions = {},
) {
    if (!this.isW3C) {
        return this.moveToElement(this.elementId, xOffset, yOffset)
    }
    /**
     * W3C way of handle the mouse move actions
     */
    const browser = getBrowserObject(this)
    const moveToNested = async ( xOffset?: number, yOffset?: number ) => {
        return  await browser.action('pointer', { parameters: { pointerType: 'mouse' } })
            .move({ origin: this, x: xOffset ? xOffset : 0, y: yOffset ? yOffset : 0 })
            .perform()
    }
    try {
        return await moveToNested(xOffset, yOffset)
    } catch {
        /**
        * Workaround, because sometimes browser.action().move() flaky and isn't able to scroll pointer to into view
        * Moreover the action  with 'nearest' behavior by default where element is aligned at the bottom of its ancestor.
        * and could be overlapped. Scroll to center should definitely work even if element was covered with sticky header/footer
        */
        await this.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' })
        return await moveToNested(xOffset, yOffset)
    }
}
