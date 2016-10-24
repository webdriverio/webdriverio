/**
 *
 * Returns true if at least one element is existing by given selector
 *
 * <example>
    :index.html
    <div id="notDisplayed" style="display: none"></div>
    <div id="notVisible" style="visibility: hidden"></div>
    <div id="notInViewport" style="position:absolute; left: 9999999"></div>
    <div id="zeroOpacity" style="opacity: 0"></div>

    :isExisting.js
    it('should detect if elements are existing', function () {
        var isExisting;
        isExisting = browser.isExisting('#someRandomNonExistingElement');
        console.log(isExisting); // outputs: false

        isExisting = browser.isExisting('#notDisplayed');
        console.log(isExisting); // outputs: true

        isExisting = browser.isExisting('#notVisible');
        console.log(isExisting); // outputs: true

        isExisting = browser.isExisting('#notInViewport');
        console.log(isExisting); // outputs: true

        isExisting = browser.isExisting('#zeroOpacity');
        console.log(isExisting); // outputs: true
    });
 * </example>
 *
 * @alias browser.isExisting
 * @param   {String}             selector  DOM-element
 * @returns {Boolean|Boolean[]}            true if element(s)* [is|are] existing
 * @uses protocol/elements
 * @type state
 *
 */

let isExisting = function (selector) {
    return this.elements(selector).then((res) => {
        if (Array.isArray(res.value) && res.value.length > 0) {
            return true
        }

        return false
    })
}

export default isExisting
