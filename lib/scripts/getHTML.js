/**
 * get HTML of selector element
 *
 * @param  {String}  selector            element to get HTML from
 * @param  {Boolean} includeSelectorTag  if true, selector tag gets included (uses outerHTML)
 * @return {String}                      html source
 */

let getHTML = function (elements, includeSelectorTag) {
    var ret = [];

    if (elements.length === 0) {
        return null;
    }

    for (var i = 0; i < elements.length; ++i) {
        ret.push(elements[i][includeSelectorTag ? 'outerHTML' : 'innerHTML']);
    }

    return ret;
}

export default getHTML
