/**
 *
 * Return true if the selected DOM-element is displayed.
 *
 * <example>
    :index.html
    <div id="notDisplayed" style="display: none"></div>
    <div id="notVisible" style="visibility: hidden"></div>
    <div id="notInViewport" style="position:absolute; left: 9999999"></div>
    <div id="zeroOpacity" style="opacity: 0"></div>
    :isDisplayed.js
    it('should detect if an element is displayed', function () {
        let elem = $('#notDisplayed');
        let isDisplayed = elem.isDisplayed();
        console.log(isDisplayed); // outputs: false

        elem = $('#notVisible');

        isDisplayed = elem.isDisplayed();
        console.log(isDisplayed); // outputs: false

        elem = $('#notExisting');
        isDisplayed = elem.isDisplayed();
        console.log(isDisplayed); // outputs: false

        elem = $('#notInViewport');
        isDisplayed = elem.isDisplayed();
        console.log(isDisplayed); // outputs: true

        elem = $('#zeroOpacity');
        isDisplayed = elem.isDisplayed();
        console.log(isDisplayed); // outputs: true
    });
 * </example>
 *
 * @alias browser.isDisplayed
 * @return {Boolean} true if element(s)* [is|are] displayed
 * @uses protocol/elements, protocol/elementIdDisplayed
 * @type state
 *
 */

export default function isDisplayed() {
    return this.isElementDisplayed(this.elementId)
}
