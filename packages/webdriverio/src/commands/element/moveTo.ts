import { getElementRect, getBrowserObject } from '../../utils/index.js'

type MoveToOptions = {
    xOffset?: number,
    yOffset?: number
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
    { xOffset, yOffset }: MoveToOptions = {}
) {
    if (!this.isW3C) {
        return this.moveToElement(this.elementId, xOffset, yOffset)
    }

    /**
     * get rect of element
     */
    const { width, height } = await getElementRect(this)
    const newXOffset = Math.floor(typeof xOffset === 'number' ? xOffset : (width / 2))
    const newYOffset = Math.floor(typeof yOffset === 'number' ? yOffset : (height / 2))

    /**
     * W3C way of handle the mouse move actions
     */
    const browser = getBrowserObject(this)
    return browser.action('pointer', { parameters: { pointerType: 'mouse' } })
        .move({ origin: this, x: newXOffset, y: newYOffset })
        .perform()
}
