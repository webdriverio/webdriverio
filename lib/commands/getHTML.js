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
    client
        .getHTML('#test', function(err, html) {
            console.log(html);
            // outputs the following:
            // "<div id="test"><span>Lorem ipsum dolor amet</span></div>"
        })
        .getHTML('#test', false, function(err, html) {
            console.log(html);
            // outputs the following:
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

    return this.selectorExecute(selector, getHTMLHelper, includeSelectorTag).then((html) => {
        /**
         * throw NoSuchElement error if no element was found
         */
        if (!html) {
            throw new CommandError(7)
        }

        return html && html.length === 1 ? html[0] : html
    })
}

export default getHTML
