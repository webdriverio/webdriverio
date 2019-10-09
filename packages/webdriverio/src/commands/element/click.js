/**
 *
 * Click on an element.
 *
 * Note: This issues a Webdriver `click` command for the selected element, which generally scrolls to and then clicks the
 * selected element. However, if you have fixed-position elements (such as a fixed header or footer) that cover up the
 * selected element after it is scrolled within the viewport, the click will be issued at the given coordinates, but will
 * be received by your fixed (overlaying) element. In these cased the following error is thrown:
 *
 * ```
 * Element is not clickable at point (x, x). Other element would receive the click: ..."
 * ```
 *
 * To work around this, try to find the overlaying element and remove it via `execute` command so it doesn't interfere
 * the click. You also can try to scroll to the element yourself using `scroll` with an offset appropriate for your
 * scenario.
 *
 * <example>
    :example.html
    <button id="myButton" onclick="document.getElementById('someText').innerHTML='I was clicked'">Click me</button>
    <div id="someText">I was not clicked</div>
    :click.js
    it('should demonstrate the click command', () => {
        const myButton = $('#myButton')
        myButton.click()
        const myText = $('#someText')
        const text = myText.getText();
        assert(text === 'I was clicked'); // true
    })
    :example.js
    it('should fetch menu links and visit each page', () => {
        const links = $$('#menu a');
        links.forEach((link) => {
            link.click();
        });
    });
 * </example>
 *
 * Example of a right click using the options
 *
 * <example>
    :example.html
    <button id="myButton">Click me</button>
    :example.js
    it('should demonstrate a right click passed as string', () => {
        const myButton = $('#myButton')
        myButton.click({ button: 'right' }) // opens the contextmenu at the location of the button
    })
    it('should demonstrate a right click passed as number', () => {
        const myButton = $('#myButton')
        myButton.click({ button: 2 }) // opens the contextmenu at the location of the button
    })
 * </example>
 *
 * @alias element.click
 * @uses protocol/element, protocol/elementIdClick, protocol/performActions, protocol/positionClick
 * @type action
 * @param {Object=} options object containing a property called `button` which can be set to 0 (left) 1 (middle) or 2 (right) button
 */

export default async function click (options) {
    let { button } = options || {}

    if (button === 'left') {
        button = 0
    }

    if (button === 'middle') {
        button = 1
    }

    if (button === 'right') {
        button = 2
    }

    if (typeof button === 'undefined') {
        return this.elementClick(this.elementId)
    }

    if ([0, 1, 2].includes(button)) {
        if (this.isW3C) {
            await this.performActions([{
                type: 'pointer',
                id: 'pointer1',
                parameters: { pointerType: 'mouse' },
                actions: [
                    { type: 'pointerMove', origin: this, x: 0, y: 0 },
                    { type: 'pointerDown', button },
                    { type: 'pointerUp', button }
                ]
            }])

            return this.releaseActions()
        }

        await this.moveTo()
        return this.positionClick(button)
    }

    throw new Error('Button type not supported.')
}
