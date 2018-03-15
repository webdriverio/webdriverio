/**
 *
 * Return true if the selected DOM-element is visible.
 *
 * <example>
    :index.html
    <div id="notDisplayed" style="display: none"></div>
    <div id="notVisible" style="visibility: hidden"></div>
    <div id="notInViewport" style="position:absolute; left: 9999999"></div>
    <div id="zeroOpacity" style="opacity: 0"></div>
    :isVisible.js
    it('should detect if an element is visible', function () {
        let elem = $('#notDisplayed');
        let isVisible = elem.isVisible();
        console.log(isVisible); // outputs: false

        elem = $('#notVisible');
        isVisible = elem.isVisible();
        console.log(isVisible); // outputs: false
        
        elem = $('#notExisting');
        isVisible = elem.isVisible();
        console.log(isVisible); // outputs: false

        elem = $('#notInViewport');
        isVisible = elem.isVisible();
        console.log(isVisible); // outputs: true

        elem = $('#zeroOpacity');
        isVisible = elem.isVisible();
        console.log(isVisible); // outputs: true
    });
 * </example>
 *
 * @alias browser.isVisible
 * @return {Boolean} true if element(s)* [is|are] visible
 * @uses protocol/elements, protocol/elementIdDisplayed
 * @type state
 *
 */

export default function isDisplayed() {
    return this.isElementDisplayed(this.elementId)
}
