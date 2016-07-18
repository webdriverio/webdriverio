/**
 * Works just like execute, only you can use selectors to pass html elements to
 * the function you wish to execute in the browser.
 *
 * The function fn will receive every resolved selector as an array of html elements,
 * even if there is only one result, or no result.
 * These arrays are the first arguments the function fn receives.
 * If you pass an array of selectors, the resulting html element arrays are returned in the same order.
 *
 * All arguments you append after function fn are added as the arguments after the html arrays.
 * You can use any JSON value or a function as such an argument.
 *
 * <example>
    :selectorExecuteAsync.js
    client.selectorExecute("//div", function(divs, message) {
        return divs.length + message;
    }, " divs on the page").then(function(res) {
        console.log(res); // returns, for example, "68 divs on the page"
    });

    client.selectorExecute(["//div", "=Read Post"], function(divs, links) {
        var message = 'There are ';

        message += divs.length + ' divs on the page';
        message += ' and ';
        message += links.length + ' links with an link text "' + links[0].text + '"';

        return message;
    }).then(function(res) {
        console.log(res); // returns, for example, "There are 68 divs on the page and 42 links with an link text 'Read Post'"
    });
 * </example>
 *
 * @alias browser.selectorExecute
 * @param {String|Array.<String>} selectors                  single selector or array of selectors
 * @param {Function}              script                     function to get executed in the browser
 * @param {...*}                  [argument1,...,argumentN]  arguments added to fn. Can be any JSON value or function
 * @uses protocol/execute
 * @type action
 */

import ensureClientSideSelectorSupport from '../helpers/ensureClientSideSelectorSupport'
import createSelectorScript from '../scripts/createSelectorScript'
import { CommandError } from '../utils/ErrorHandler'

let selectorExecute = function (selector, script, ...args) {
    /**
     * if selectorExecute gets executed with element as first citizen like
     *
     * ```js
     * var elem = browser.element('#elem');
     * elem.selectorExecute(function () {...}, some, args);
     * ```
     */
    if (typeof selector === 'function' && this.lastResult && typeof this.lastResult.selector === 'string') {
        args.unshift(script)
        script = selector
        selector = [this.lastResult.selector]

    /**
     * if selectorExecute gets executed by getHTML
     */
    } else if (selector === null) {
        selector = [this.lastResult.selector]
    }

    if (typeof selector === 'string') {
        selector = [selector]
    }

    if (!Array.isArray(selector)) {
        throw new CommandError('Argument \'selector\' must be string or array of strings.')
    }
    if (!/string|function/.test(typeof script)) {
        throw new CommandError('Argument \'script\' must be a function or string.')
    }

    let fullScript = createSelectorScript.call(this, script, selector, args)
    return ensureClientSideSelectorSupport.call(this).execute(fullScript).then((res) => {
        var result = res && res.value

        if (result && result.message === 'NoSuchElement') {
            throw new CommandError(7)
        }

        return result
    })
}

export default selectorExecute
