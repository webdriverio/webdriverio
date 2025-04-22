import { ELEMENT_KEY } from '@testplane/webdriver'
import type { ElementReference } from '@testplane/wdio-protocols'
import { getBrowserObject } from '@testplane/wdio-utils'
import type { ChainablePromiseElement, DragAndDropCoordinate, DragAndDropOptions } from '../../types.js'

const sleep = (time = 0) => new Promise((resolve) => setTimeout(resolve, time))

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
        const elem = $('#someElem')
        const target = $('#someTarget')

        // drag and drop to other element
        await elem.dragAndDrop(target)

        // drag and drop relative from current position
        await elem.dragAndDrop({ x: 100, y: 200 })
    })
 * </example>
 *
 * @alias element.dragAndDrop
 * @param {Element|DragAndDropCoordinate}   target            destination element or object with x and y properties
 * @param {DragAndDropOptions=}             options           dragAndDrop command options
 * @param {Number=}                         options.duration  how long the drag should take place
 */
export async function dragAndDrop (
    this: WebdriverIO.Element,
    target: WebdriverIO.Element | ChainablePromiseElement<WebdriverIO.Element> | Partial<DragAndDropCoordinate>,
    options: DragAndDropOptions = {}
) {
    const moveToCoordinates = target as DragAndDropCoordinate
    const moveToElement = await target as WebdriverIO.Element

    /**
     * fail if
     */
    if (
        /**
         * no target was specified
         */
        !moveToElement ||
        (
            /**
             * target is not from type element
             */
            moveToElement.constructor.name !== 'Element' &&
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

    const ACTION_BUTTON = 0 as const
    const browser = getBrowserObject(this)
    const defaultOptions = { duration: browser.isMobile ? 250 : 10 }
    const { duration } = { ...defaultOptions, ...options }

    /**
     * allow to specify an element or an x/y vector
     */
    const isMovingToElement = moveToElement.constructor.name === 'Element'

    if (!this.isW3C) {
        await this.moveTo()
        await this.buttonDown(ACTION_BUTTON)

        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
    return browser
        .action('pointer', {
            parameters: { pointerType: browser.isMobile ? 'touch' : 'mouse' }
        })
        .move({ duration: 0, origin, x: 0, y: 0 })
        .down({ button: ACTION_BUTTON })
        .pause(10)
        .move({ duration, origin: targetOrigin, x: targetX, y: targetY })
        .up({ button: ACTION_BUTTON })
        .perform()
}
