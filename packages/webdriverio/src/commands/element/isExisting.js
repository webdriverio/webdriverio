
/**
 *
 * Returns true if element exists in the DOM
 *
 * <example>
    :index.html
    <div id="notDisplayed" style="display: none"></div>
    <div id="notVisible" style="visibility: hidden"></div>
    <div id="notInViewport" style="position:absolute; left: 9999999"></div>
    <div id="zeroOpacity" style="opacity: 0"></div>
    :isExisting.js
    it('should detect if elements are existing', () => {
        let elem = $('#someRandomNonExistingElement')
        let isExisting = elem.isExisting()
        console.log(isExisting); // outputs: false

        elem = $('#notDisplayed')
        isExisting = elem.isExisting()
        console.log(isExisting); // outputs: true

        elem = $('#notVisible')
        isExisting = elem.isExisting()
        console.log(isExisting); // outputs: true

        elem = $('#notInViewport')
        isExisting = elem.isExisting()
        console.log(isExisting); // outputs: true

        elem = $('#zeroOpacity')
        isExisting = elem.isExisting()
        console.log(isExisting); // outputs: true
    });
 * </example>
 *
 * @alias element.isExisting
 * @return {Boolean}            true if element(s)* [is|are] existing
 * @uses protocol/elements
 * @type state
 *
 */

export default function isExisting () {
    return this.parent.$$(this.selector).then((res) => res.length > 0)
}
