/**
 *
 * Drag an item to a destination element.
 *
 * <example>
    :example.test.js
    it('should demonstrate the dragAndDrop command', () => {
        const elem = $('#someElem')
        const target = $('#someTarget')
        elem.dragAndDrop(target)
    })
 * </example>
 *
 * @alias element.dragAndDrop
 * @param {Element|DragAndDropCoordinate} target    destination selector
 * @param {DragAndDropOptions=} options           dragAndDrop command options
 * @param {Number=}             options.duration  how long the drag should take place
 * @uses action/moveToObject, protocol/buttonDown, protocol/buttonUp, property/getLocation, protocol/touchDown, protocol/touchMove, protocol/touchUp
 * @type action
 *
 */

import { getElementRect, getScrollPosition } from '../../utils'

const ACTION_BUTTON = 0

export default async function dragAndDrop (target, { duration = 100 } = {}) {
    /**
     * fail if
     */
    if (
        /**
         * no target was specified
         */
        !target ||
        (
            /**
             * target is not from type element
             */
            target.constructor.name !== 'Element' &&
            /**
             * and is also not an object with x and y number parameters
             */
            (
                typeof target.x !== 'number' ||
                typeof target.y !== 'number'
            )
        )
    ) {
        throw new Error('command dragAndDrop requires an WebdriverIO Element or and object with "x" and "y" variables as first parameter')
    }

    /**
     * allow to specify an element or an x/y vector
     */
    const moveToElement = target.constructor.name === 'Element'

    if (!this.isW3C) {
        await this.moveTo()
        await this.buttonDown(ACTION_BUTTON)

        if (moveToElement) {
            await target.moveTo()
        } else {
            await this.moveToElement(null, target.x, target.y)
        }

        return this.buttonUp(ACTION_BUTTON)
    }

    /**
     * get coordinates to drag and drop
     */
    const { scrollX, scrollY } = await getScrollPosition(this)
    const sourceRect = await getElementRect(this)
    const sourceX = parseInt(sourceRect.x - scrollX + (sourceRect.width / 2), 10)
    const sourceY = parseInt(sourceRect.y - scrollY + (sourceRect.height / 2), 10)

    let targetX, targetY
    if (moveToElement) {
        const targetRect = await getElementRect(target)
        targetX = parseInt(targetRect.x - scrollX + (targetRect.width / 2), 10) - sourceX
        targetY = parseInt(targetRect.y - scrollY + (targetRect.height / 2), 10) - sourceY
    } else {
        targetX = target.x
        targetY = target.y
    }

    /**
     * W3C way of handle the drag and drop action
     */
    return this.performActions([{
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'mouse' },
        actions: [
            { type: 'pointerMove', duration: 0, x: sourceX, y: sourceY },
            { type: 'pointerDown', button: ACTION_BUTTON },
            { type: 'pause', duration: 10 }, // emulate human pause
            { type: 'pointerMove', duration, origin: 'pointer', x: targetX, y: targetY },
            { type: 'pointerUp', button: ACTION_BUTTON }
        ]
    }]).then(() => this.releaseActions())
}
