/**
 * get HTML of selector element
 *
 * @param  {String}  selector            element to get HTML from
 * @param  {Boolean} includeSelectorTag  if true, selector tag gets included (uses outerHTML)
 * @return {String}                      html source
 */

/* global document */
module.exports = function(selector, includeSelectorTag) {

    var elements = document.querySelectorAll(selector),
        ret = [];

    if (elements.length === 0) {
        return null;
    }

    for (var i = 0; i < elements.length; ++i) {
        ret.push(elements[i][includeSelectorTag ? 'outerHTML' : 'innerHTML']);
    }

    return ret;

};