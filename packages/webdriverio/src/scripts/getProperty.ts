/**
 * get property from element
 * @param  {string} element    element with requested property
 * @param  {string} property   requested property
 * @return {String}            the value of the property
 */
export default function getProperty (element: Record<string, unknown>, property: string) {
    return element[property]
}
