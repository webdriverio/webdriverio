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
 * @alias element.click
 * @uses protocol/element, protocol/elementIdClick
 * @type action
 *
 */

export default function click () {
    return this.elementClick(this.elementId)
}
