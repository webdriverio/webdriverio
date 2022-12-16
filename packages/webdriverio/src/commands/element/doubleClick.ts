import { getBrowserObject } from '../../utils/index.js'

/**
 *
 * Double-click on an element.
 *
 * <example>
    :example.html
    <button id="myButton" ondblclick="document.getElementById('someText').innerHTML='I was dblclicked'">Click me</button>
    <div id="someText">I was not clicked</div>
    :doubleClick.js
    it('should demonstrate the doubleClick command', async () => {
        const myButton = await $('#myButton')
        await myButton.doubleClick()

        const value = await myButton.getText()
        assert(value === 'I was dblclicked') // true
    })
 * </example>
 *
 * @alias element.doubleClick
 * @uses protocol/element, protocol/moveTo, protocol/doDoubleClick, protocol/touchDoubleClick
 * @type action
 *
 */
export async function doubleClick (this: WebdriverIO.Element) {
    /**
     * move to element
     */
    if (!this.isW3C) {
        await this.moveTo()
        return this.positionDoubleClick()
    }

    /**
     * W3C way of handle the double click actions
     */
    const browser = getBrowserObject(this)
    return browser.action('pointer', { parameters: { pointerType: 'mouse' } })
        .move({ origin: this })
        .down()
        .up()
        .pause(10)
        .down()
        .up()
        .perform()
}
