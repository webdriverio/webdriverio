/**
 *
 * Get the text content from a DOM-element. Make sure the element
 * you want to request the text from [is interactable](http://www.w3.org/TR/webdriver/#interactable)
 * otherwise you will get an empty string as return value. If the element is disabled or not
 * visible and you still want to receive the text content use [getHTML](http://webdriver.io/docs/api/element/getHTML.html)
 * as a workaround.
 *
 * <example>
    :index.html
    <div id="elem">
        Lorem ipsum <strong>dolor</strong> sit amet,<br>
        consetetur sadipscing elitr
    </div>
    <span style="display: none">I am invisible</span>
    :getText.js
    it('should demonstrate the getText function', () => {
        const elem = $('#elem');
        console.log(elem.getText());
        // outputs the following:
        // "Lorem ipsum dolor sit amet,consetetur sadipscing elitr"

        const span = $('span');
        console.log(span.getText());
        // outputs "" (empty string) since element is not interactable
    });
    it('get content from table cell', () => {
        browser.url('http://the-internet.herokuapp.com/tables');
        const rows = $$('#table1 tr');
        const columns = rows[1].$$('td'); // get columns of 2nd row
        console.log(columns[2].getText()); // get text of 3rd column
    });
 * </example>
 *
 * @alias browser.getText
 * @return {String} content of selected element (all HTML tags are removed)
 * @uses protocol/elements, protocol/elementIdText
 * @type property
 *
 */

export default function getText () {
    return this.getElementText(this.elementId)
}
