import { getBrowserObject } from '../../utils/index.js'
import { ELEMENT_KEY } from '../../constants.js'
import isElementInViewportScript from '../../scripts/isElementInViewport.js'

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
    { xOffset, yOffset }: MoveToOptions = {}
) {
    if (!this.isW3C) {
        return this.moveToElement(this.elementId, xOffset, yOffset)
    }
    const isIntoView = async () => {
        return await browser.execute(isElementInViewportScript, {
            [ELEMENT_KEY]: this.elementId, // w3c compatible
            ELEMENT: this.elementId // jsonwp compatible
        } as any as HTMLElement)
    }
    /**
     * W3C way of handle the mouse move actions
     */
    const browser = getBrowserObject(this)
    await this.scrollIntoView({ block : 'nearest', inline: 'nearest', behavior: 'instant' })
    if (!(await isIntoView())) {
        await this.scrollIntoView({ block : 'center', inline: 'center', behavior: 'instant' })
    }
    return browser.action('pointer', { parameters: { pointerType: 'mouse' } })
        .move({ origin: this, x: xOffset ? xOffset : 0, y: yOffset ? yOffset : 0 })
        .perform()
}
