/**
 *
 * Drag an item to a destination element or position.
 *
 * <example>
    :example.test.js
    it('should demonstrate the dragAndDrop command', () => {
        const elem = $('#someElem')
        const target = $('#someTarget')

        // drag and drop to other element
        elem.dragAndDrop(target)

        // drag and drop relative from current position
        elem.dragAndDrop({ x: 100, y: 200 })
    })
 * </example>
 *
 * @alias element.dragAndDrop
 * @param {Element|DragAndDropCoordinate} target  destination element or object with x and y properties
 * @param {DragAndDropOptions=} options           dragAndDrop command options
 * @param {Number=}             options.duration  how long the drag should take place
 */

import { getElementRect, getScrollPosition } from '../../utils'

const ACTION_BUTTON = 0

const sleep = (time = 0) => new Promise((resolve) => setTimeout(resolve, time))

type DragAndDropOptions = {
    duration?: number
}

type ElementCoordinates = {
    x?: number
    y?: number
}

export default async function dragAndDrop (
    this: WebdriverIO.Element,
    target: WebdriverIO.Element | ElementCoordinates,
    { duration = 10 }: DragAndDropOptions = {}
) {
    const moveToCoordinates = target as ElementCoordinates
    const moveToElement = target as WebdriverIO.Element

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
                typeof moveToCoordinates.x !== 'number' ||
                typeof moveToCoordinates.y !== 'number'
            )
        )
    ) {
        throw new Error('command dragAndDrop requires an WebdriverIO Element or and object with "x" and "y" variables as first parameter')
    }

    /**
     * allow to specify an element or an x/y vector
     */
    const isMovingToElement = target.constructor.name === 'Element'

    if (!this.isW3C) {
        await this.moveTo()
        await this.buttonDown(ACTION_BUTTON)

        if (isMovingToElement) {
            await moveToElement.moveTo()
        } else {
            await this.moveToElement(null, moveToCoordinates.x, moveToCoordinates.y)
        }

        await sleep(duration)
        return this.buttonUp(ACTION_BUTTON)
    }

    /**
     * get coordinates to drag and drop
     */
    const { scrollX, scrollY } = await getScrollPosition(this)
    const sourceRect = await getElementRect(this)
    const sourceX = Math.floor(sourceRect.x - scrollX + (sourceRect.width / 2))
    const sourceY = Math.floor(sourceRect.y - scrollY + (sourceRect.height / 2))

    let targetX, targetY
    if (isMovingToElement) {
        const targetRect = await getElementRect(moveToElement)
        targetX = Math.floor(targetRect.x - scrollX + (targetRect.width / 2) - sourceX)
        targetY = Math.floor(targetRect.y - scrollY + (targetRect.height / 2) - sourceY)
    } else {
        targetX = moveToCoordinates.x
        targetY = moveToCoordinates.y
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
