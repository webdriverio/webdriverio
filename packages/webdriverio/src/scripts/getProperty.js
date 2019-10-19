/**
 * Get property from element.
 * @param  {String} element    - Element with requested property
 * @param  {String} property   - Requested property
 * @return {String}            - The value of the property
 */
export default function getProperty (element, property) {
    return element[property]
}
