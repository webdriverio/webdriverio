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
 * @param {String}   selector           element to get the current DOM structure from
 * @param {Boolean=} includeSelectorTag if true it includes the selector element tag (default: true)
 *
 * @uses action/selectorExecute
 * @type property
 *
 */

'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var _scriptsGetHTML = require('../scripts/getHTML');

var _scriptsGetHTML2 = _interopRequireDefault(_scriptsGetHTML);

var getHTML = function getHTML(selector, includeSelectorTag) {
    /**
     * we can't use default values for function parameter here because this would
     * break the ability to chain the command with an element if includeSelectorTag is used
     */
    includeSelectorTag = typeof includeSelectorTag === 'boolean' ? includeSelectorTag : true;

    return this.selectorExecute(selector, _scriptsGetHTML2['default'], includeSelectorTag).then(function (html) {
        /**
         * throw NoSuchElement error if no element was found
         */
        if (!html) {
            throw new _utilsErrorHandler.CommandError(7);
        }

        return html && html.length === 1 ? html[0] : html;
    });
};

exports['default'] = getHTML;
module.exports = exports['default'];
