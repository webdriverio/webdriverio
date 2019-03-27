/**
 *
 * Drag an item to a destination element.
 *
 * @alias element.dragAndDrop
 * @param {Element} target    destination selector
 * @param {Number=}  duration  how long the drag should take place
 * @uses action/moveToObject, protocol/buttonDown, protocol/buttonUp, property/getLocation, protocol/touchDown, protocol/touchMove, protocol/touchUp
 * @type action
 *
 */

import { getElementRect } from '../../utils'

const ACTION_BUTTON = 0

export default async function dragAndDrop (target, duration = 100) {
    if (!target || target.constructor.name !== 'Element') {
        throw new Error('command dragAndDrop requires an WebdriverIO Element as first parameter')
    }

    if (!this.isW3C) {
        await this.moveTo()
        await this.buttonDown(ACTION_BUTTON)
        await target.moveTo()
        return this.buttonUp(ACTION_BUTTON)
    }

    /**
     * get coordinates to drag and drop
     */
    const sourceRect = await getElementRect(this)
    const targetRect = await getElementRect(target)
    const sourceX = parseInt(sourceRect.x + (sourceRect.width / 2), 10)
    const sourceY = parseInt(sourceRect.y + (sourceRect.height / 2), 10)
    const targetX = parseInt(targetRect.x + (targetRect.width / 2), 10) - sourceX
    const targetY = parseInt(targetRect.y + (targetRect.height / 2), 10) - sourceY

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
