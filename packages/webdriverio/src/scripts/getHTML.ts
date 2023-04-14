
/**
 * get HTML of selector element
 *
 * @param  {string}  element             element to get HTML from
 * @param  {Boolean} includeSelectorTag  if true, selector tag gets included (uses outerHTML)
 * @return {String}                      html source
 */

export default function getHTML (element: HTMLElement, includeSelectorTag: boolean) {
    return element[includeSelectorTag ? 'outerHTML' : 'innerHTML']
}
