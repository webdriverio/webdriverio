
/**
 * get HTML of selector element
 *
 * @param  {String}  selector            element to get HTML from
 * @param  {Boolean} includeSelectorTag  if true, selector tag gets included (uses outerHTML)
 * @return {String}                      html source
 */

export default function getHTML (element, includeSelectorTag) {
    return element[includeSelectorTag ? 'outerHTML' : 'innerHTML']
}
