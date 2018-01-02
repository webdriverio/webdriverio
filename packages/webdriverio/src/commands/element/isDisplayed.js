/**
 *
 * Return true if the selected DOM-element found by given selector is visible. Returns an array if multiple DOM-elements are found for the given selector.
 *
 * <example>
    :index.html
    <div id="notDisplayed" style="display: none"></div>
    <div id="notVisible" style="visibility: hidden"></div>
    <div id="notInViewport" style="position:absolute; left: 9999999"></div>
    <div id="zeroOpacity" style="opacity: 0"></div>
    :isVisible.js
    it('should detect if an element is visible', function () {
        const elem = $('#notDisplayed');
        const isVisible = elem.isVisible()

        console.log(isVisible); // outputs: false
        isVisible = browser.isVisible('#notVisible');
        console.log(isVisible); // outputs: false
        isVisible = browser.isVisible('#notExisting');
        console.log(isVisible); // outputs: false
        isVisible = browser.isVisible('#notInViewport');
        console.log(isVisible); // outputs: true
        isVisible = browser.isVisible('#zeroOpacity');
        console.log(isVisible); // outputs: true
    });
 * </example>
 *
 * @alias browser.isVisible
 * @param   {String}             selector  DOM-element
 * @return {Boolean|Boolean[]}            true if element(s)* [is|are] visible
 * @uses protocol/elements, protocol/elementIdDisplayed
 * @type state
 *
 */

export default function isDisplayed() {
    return this.isElementDisplayed(this.elementId)
}
