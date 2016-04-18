/**
 * Works just like execute, only you can use Selenium selector strategies to pass html elements to
 * the asynchronous function you wish to execute in the browser.
 *
 * The asynchronous function fn will receive every resolved selector as an array of html elements,
 * even if there is only one result, or no result.
 * These arrays are the first arguments the function fn receives.
 * If you pass an array of selectors, the resulting html element arrays are returned in the same order.
 *
 * All arguments you append after function fn are added as the arguments after the html arrays.
 * You can use any JSON value or a function as such an argument.
 *
 * <example>
 :selectorExecuteAsyncAsync.js
    client.selectorExecuteAsync("//div", function(divs, message, callback) {
        callback(divs.length + message);
    }, " divs on the page").then(function(msg){
        console.log(msg); // returns, for example, "68 divs on the page"
    });

    client.selectorExecuteAsync(["//div", "=Read Post"], function(divs, links, callback) {
        var message = 'There are ';

        message += divs.length + ' divs on the page';
        message += ' and ';
        message += links.length + ' links with an link text "' + links[0].text + '"';

        callback(message);
    }).then(function(msg){
        console.log(msg); // returns, for example, "There are 68 divs on the page and 42 links with an link text 'Read Post'"
    });
 * </example>
 *
 * @param {String|Array.<String>} selectors                  single selector or array of selectors
 * @param {Function}              script                     asynchronous function to get executed in the browser
 * @param {...*}                  [argument1,...,argumentN]  arguments added to fn. Can be any JSON value or function
 *
 * @uses protocol/execute
 * @type action
 */

'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _helpersEnsureClientSideSelectorSupport = require('../helpers/ensureClientSideSelectorSupport');

var _helpersEnsureClientSideSelectorSupport2 = _interopRequireDefault(_helpersEnsureClientSideSelectorSupport);

var _scriptsCreateSelectorScript = require('../scripts/createSelectorScript');

var _scriptsCreateSelectorScript2 = _interopRequireDefault(_scriptsCreateSelectorScript);

var _utilsErrorHandler = require('../utils/ErrorHandler');

var selectorExecuteAsync = function selectorExecuteAsync(selector, script) {
    for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        args[_key - 2] = arguments[_key];
    }

    /**
     * if selectorExecuteAsync gets executed with element as first citizen like
     *
     * ```js
     * var elem = browser.element('#elem');
     * elem.selectorExecuteAsync(function () {...}, some, args);
     * ```
     */
    if (typeof selector === 'function' && this.lastResult && typeof this.lastResult.selector === 'string') {
        args.unshift(script);
        script = selector;
        selector = [this.lastResult.selector];

        /**
         * if selectorExecuteAsync gets executed by getHTML
         */
    } else if (selector === null) {
            selector = [this.lastResult.selector];
        }

    if (typeof selector === 'string') {
        selector = [selector];
    }
    if (!Array.isArray(selector)) {
        throw new _utilsErrorHandler.CommandError('Argument \'selector\' must be string or array of strings.');
    }
    if (!/string|function/.test(typeof script)) {
        throw new _utilsErrorHandler.CommandError('Argument \'script\' must be a function or string.');
    }

    var fullScript = _scriptsCreateSelectorScript2['default'].call(this, script, selector, args);
    return _helpersEnsureClientSideSelectorSupport2['default'].call(this).executeAsync(fullScript).then(function (res) {
        var result = res && res.value;

        if (result && result.message === 'NoSuchElement') {
            throw new _utilsErrorHandler.CommandError(7);
        }

        return result;
    });
};

exports['default'] = selectorExecuteAsync;
module.exports = exports['default'];
