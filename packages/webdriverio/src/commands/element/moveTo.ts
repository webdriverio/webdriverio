import logger from '@wdio/logger'

import { getBrowserObject } from '@wdio/utils'
import type { MoveToOptions } from '../../types.js'
import { foreignContext } from '../../utils/foreignContext.js'

const log = logger('webdriver')

/**
 *
 * Move the mouse by an offset of the specified element. If no element is specified,
 * the move is relative to the current mouse cursor. If an element is provided but
 * no offset, the mouse will be moved to the center of the element. If the element
 * is not visible, it will be scrolled into view.
 *
 * @param {MoveToOptions=} options          moveTo command options
 * @param {Number=}        options.xOffset  X offset to move to, relative to the center of the element. If not specified, the mouse will move to the center of the element.
 * @param {Number=}        options.yOffset  Y offset to move to, relative to the center of the element. If not specified, the mouse will move to the center of the element.
 *
 * @see https://w3c.github.io/webdriver/#pointer-actions
 * @type protocol
 */
export async function moveTo (
    this: WebdriverIO.Element,
    { xOffset, yOffset }: MoveToOptions = {},
) {
    const browser = getBrowserObject(this)
    if (xOffset || yOffset) {
        const { width, height } = await this.getElementRect(this.elementId)
        if ((xOffset && xOffset < (-Math.floor(width / 2))) || (xOffset && xOffset > Math.floor(width / 2))) {
            log.warn('xOffset would cause a out of bounds error as it goes outside of element')
        }
        if ((yOffset && yOffset < (-Math.floor(height / 2))) || (yOffset && yOffset > Math.floor(height / 2))) {
            log.warn('yOffset would cause a out of bounds error as it goes outside of element')
        }
    }
    /**
     * Classic WebDriver rejects a move to an element outside the viewport,
     * which the fallback below answers with a scroll. A move in the context of
     * a held frame lands outside the viewport without an error. Scroll the
     * element and the frames around it into view first. `nearest` leaves a
     * visible element in place.
     */
    const held = await foreignContext(this)
    if (held) {
        await held.execute((elem: HTMLElement) => {
            elem.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        }, this as unknown as HTMLElement)
    }
    const moveToNested = async () => {
        await browser.action('pointer', { parameters: { pointerType: 'mouse' } })
            .move({ origin: this, x: xOffset || 0, y: yOffset || 0 })
            .perform()
    }
    try {
        await moveToNested()
    } catch {
        /**
        * Workaround, because sometimes browser.action().move() flaky and isn't able to scroll pointer to into view
        * Moreover the action  with 'nearest' behavior by default where element is aligned at the bottom of its ancestor.
        * and could be overlapped. Scroll to center should definitely work even if element was covered with sticky header/footer
        */
        await this.scrollIntoView({ block: 'center', inline: 'center' })
        await moveToNested()
    }
}
