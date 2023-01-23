import { ELEMENT_KEY } from '../../constants.js'
import { getBrowserObject } from '../../utils/index.js'
import type { ElementReference } from '@wdio/protocols'

const ACTION_BUTTON = 0 as const

const sleep = (time = 0) => new Promise((resolve) => setTimeout(resolve, time))

type DragAndDropOptions = {
    duration?: number
}

type ElementCoordinates = {
    x?: number
    y?: number
}

/**
 *
 * Drag an item to a destination element or position.
 *
 * :::info
 *
 * The functionality of this command highly depends on the way drag and drop is
 * implemented in your app. If you experience issues please post your example
 * in [#4134](https://github.com/webdriverio/webdriverio/issues/4134).
 *
 * :::
 *
 * <example>
    :example.test.js
    it('should demonstrate the dragAndDrop command', async () => {
        const elem = await $('#someElem')
        const target = await $('#someTarget')

        // drag and drop to other element
        await elem.dragAndDrop(target)

        // drag and drop relative from current position
        await elem.dragAndDrop({ x: 100, y: 200 })
    })
 * </example>
 *
 * @alias element.dragAndDrop
 * @param {Element|DragAndDropCoordinate} target  destination element or object with x and y properties
 * @param {DragAndDropOptions=} options           dragAndDrop command options
 * @param {Number=}             options.duration  how long the drag should take place
 */
export async function dragAndDrop (
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

        isMovingToElement
            ? await moveToElement.moveTo()
            : await this.moveToElement(null, moveToCoordinates.x, moveToCoordinates.y)

        await sleep(duration)
        return this.buttonUp(ACTION_BUTTON)
    }

    const sourceRef: ElementReference = { [ELEMENT_KEY]: this[ELEMENT_KEY] }
    const targetRef: ElementReference = { [ELEMENT_KEY]: moveToElement[ELEMENT_KEY] }

    const origin = sourceRef
    const targetOrigin = isMovingToElement ? targetRef : 'pointer'

    const targetX = isMovingToElement ? 0 : moveToCoordinates.x
    const targetY = isMovingToElement ? 0 : moveToCoordinates.y

    /**
     * W3C way of handle the drag and drop action
     */
    const browser = getBrowserObject(this)
    return browser.action('pointer')
        .move({ duration: 0, origin, x: 0, y: 0 })
        .down({ button: ACTION_BUTTON })
        .pause(10)
        .move({ duration, origin: targetOrigin, x: targetX, y: targetY })
        .up({ button: ACTION_BUTTON })
        .perform()
}
