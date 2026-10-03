/**
 *
 * Get the text content from a DOM-element. Make sure the element
 * you want to request the text from [is interactable](http://www.w3.org/TR/webdriver/#interactable)
 * otherwise you will get an empty string as return value. If the element is disabled or not
 * visible and you still want to receive the text content use [getHTML](https://webdriver.io/docs/api/element/getHTML)
 * as a workaround.
 *
 * <example>
    :index.html
    <div id="elem">
        Lorem ipsum <strong>dolor</strong> sit amet,<br />
        consetetur sadipscing elitr
    </div>
    <span style="display: none">I am invisible</span>
    :getText.js
    it('should demonstrate the getText function', async () => {
        const elem = await $('#elem');
        console.log(await elem.getText());
        // outputs the following:
        // "Lorem ipsum dolor sit amet,consetetur sadipscing elitr"

        const span = await $('span');
        console.log(await span.getText());
        // outputs "" (empty string) since element is not interactable
    });
    it('get content from table cell', async () => {
        await browser.url('http://the-internet.herokuapp.com/tables');
        const rows = await $$('#table1 tr');
        const columns = await rows[1].$$('td'); // get columns of 2nd row
        console.log(await columns[2].getText()); // get text of 3rd column
    });
 * </example>
 *
 * @alias element.getText
 * @return {String} content of selected element (all HTML tags are removed)
 * @uses protocol/elements, protocol/elementIdText
 * @type property
 *
 */
export function getText (this: WebdriverIO.Element) {
    return this.getElementText(this.elementId)
}
