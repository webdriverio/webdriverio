/**
 *
 * Double-click on an element.
 *
 * <example>
    :example.html
    <button id="myButton" ondblclick="document.getElementById('someText').innerHTML='I was dblclicked'">Click me</button>
    <div id="someText">I was not clicked</div>
    :doubleClick.js
    it('should demonstrate the doubleClick command', function () {
        var myButton = $('#myButton')
        myButton.doubleClick()
        // or
        browser.doubleClick('#myButton')
        var value = browser.getText('#someText')
        assert(value === 'I was dblclicked') // true
    })
 * </example>
 *
 * @alias browser.doubleClick
 * @param {String} selector  element to double click on. If it matches with more than one DOM-element it automatically clicks on the first element
 * @uses protocol/element, protocol/moveTo, protocol/doDoubleClick, protocol/touchDoubleClick
 * @type action
 *
 */
export default async function doubleClick () {
    /**
     * move to element
     */
    await this.moveTo()

    if (!this.isW3C) {
        return this.positionDoubleClick()
    }

    /**
     * W3C way of handle the double click actions
     */
    await this.performActions([{
        type: 'pointer',
        id: 'pointer1',
        parameters: { pointerType: 'mouse' },
        actions: [
            {type: 'pointerDown', button: 0},
            {type: 'pointerUp', button: 0},
            {type: 'pause', duration: 10},
            {type: 'pointerDown', button: 0},
            {type: 'pointerUp', button: 0}
        ]
    }])

    return this.releaseActions()
}
