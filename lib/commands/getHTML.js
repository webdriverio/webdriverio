/**
 *
 * Get source code of specified DOM element by selector.
 *
 * <example>
    :index.html
    <div id="test">
        <span>Lorem ipsum dolor amet</span>
    </div>

    :getHTML.js
    it('should get html for certain elements', function () {
        var outerHTML = browser.getHTML('#test');
        console.log(outerHTML);
        // outputs:
        // "<div id="test"><span>Lorem ipsum dolor amet</span></div>"

        var innerHTML = browser.getHTML('#test', false);
        console.log(innerHTML);
        // outputs:
        // "<span>Lorem ipsum dolor amet</span>"
    });
 * </example>
 *
 * @alias browser.getHTML
 * @param {String}   selector           element to get the current DOM structure from
 * @param {Boolean=} includeSelectorTag if true it includes the selector element tag (default: true)
 * @uses action/selectorExecute
 * @type property
 *
 */

import { CommandError } from '../utils/ErrorHandler'
import getHTMLHelper from '../scripts/getHTML'

let getHTML = function (selector, includeSelectorTag) {
    /**
     * we can't use default values for function parameter here because this would
     * break the ability to chain the command with an element if includeSelectorTag is used
     */
    includeSelectorTag = typeof includeSelectorTag === 'boolean' ? includeSelectorTag : true

    /**
     * check if we already queried the element within a prior command, in these cases
     * the selector attribute is null and the element can be recieved calling the
     * `element` command again
     */
    let getHtmlResultPromise
    if (selector === null) {
        getHtmlResultPromise = this.elements(selector).then(
            (res) => this.execute(getHTMLHelper, res.value, includeSelectorTag)
        ).then((result) => result.value)
    } else {
        getHtmlResultPromise = this.selectorExecute(selector, getHTMLHelper, includeSelectorTag)
    }

    return getHtmlResultPromise.then((html) => {
        /**
         * throw NoSuchElement error if no element was found
         */
        if (!html) {
            throw new CommandError(7, selector || this.lastResult.selector)
        }

        return html && html.length === 1 ? html[0] : html
    })
}

export default getHTML
