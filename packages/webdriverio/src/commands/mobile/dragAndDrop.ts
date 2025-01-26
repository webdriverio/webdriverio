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
 * Also make sure that the element you are dragging and the target where you are dropping are both visible on the screen.
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
 * @mobileElement
 */
// actual implementation is located in packages/webdriverio/src/element/dragAndDrop.ts
