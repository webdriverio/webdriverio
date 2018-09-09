/**
 * get property from element
 * @param  {String} element    element with requested property
 * @param  {String} property   requested property
 * @return {String}            the value of the property
 */
export default function getProperty (element, property) {
    return element[property]
}
