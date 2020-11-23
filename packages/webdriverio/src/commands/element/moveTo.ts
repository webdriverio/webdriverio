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

import { getElementRect, getScrollPosition } from '../../utils'

type MoveToOptions = {
    xOffset?: number,
    yOffset?: number
}

export default async function moveTo (
    this: WebdriverIO.Element,
    { xOffset, yOffset }: MoveToOptions = {}
) {
    if (!this.isW3C) {
        return this.moveToElement(this.elementId, xOffset, yOffset)
    }

    /**
     * get rect of element
     */
    const { x, y, width, height } = await getElementRect(this)
    const { scrollX, scrollY } = await getScrollPosition(this)
    const newXOffset = Math.floor(x - scrollX + (typeof xOffset === 'number' ? xOffset : (width / 2)))
    const newYOffset = Math.floor(y - scrollY + (typeof yOffset === 'number' ? yOffset : (height / 2)))

    /**
     * W3C way of handle the mouse move actions
     */
    return this.performActions([{
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'mouse' },
        actions: [{ type: 'pointerMove', duration: 0, x: newXOffset, y: newYOffset }]
    }]).then(() => this.releaseActions())
}
