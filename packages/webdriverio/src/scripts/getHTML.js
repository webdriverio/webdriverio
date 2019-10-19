
/**
 * Get HTML of selector element.
 *
 * @param  {String}  element             - Element to get HTML from
 * @param  {Boolean} includeSelectorTag  - If true, selector tag gets included (uses outerHTML)
 * @return {String}                      - Html source
 */

export default function getHTML (element, includeSelectorTag) {
    return element[includeSelectorTag ? 'outerHTML' : 'innerHTML']
}
