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

    :isVisibleAsync.js
    client
        .isVisible('#notDisplayed').then(function(isVisible) {
            console.log(isVisible); // outputs: false
        })
        .isVisible('#notVisible').then(function(isVisible) {
            console.log(isVisible); // outputs: false
        })
        .isVisible('#notExisting').then(function(isVisible) {
            console.log(isVisible); // outputs: false
        })
        .isVisible('#notInViewport').then(function(isVisible) {
            console.log(isVisible); // outputs: true!!!
        })
        .isVisible('#zeroOpacity').then(function(isVisible) {
            console.log(isVisible); // outputs: true!!!
        });
 * </example>
 *
 * @alias browser.isVisible
 * @param   {String}             selector  DOM-element
 * @returns {Boolean|Boolean[]}            true if element(s)* [is|are] visible
 * @uses protocol/elements, protocol/elementIdDisplayed
 * @type state
 *
 */

let isVisible = function (selector) {
    return this.elements(selector).then((res) => {
        /**
         * if element does not exist it is automatically not visible ;-)
         */
        if (!res.value || res.value.length === 0) {
            return false
        }

        let elementIdDisplayedCommands = []
        for (let elem of res.value) {
            elementIdDisplayedCommands.push(this.elementIdDisplayed(elem.ELEMENT))
        }

        return this.unify(elementIdDisplayedCommands, {
            extractValue: true
        })
    })
}

export default isVisible
