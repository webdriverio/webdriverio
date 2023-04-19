/**
 * get property from element
 * @param  {string} element    element with requested property
 * @param  {string} property   requested property
 * @return {String}            the value of the property
 */
export default function getProperty (element: HTMLElement, property: keyof HTMLElement) {
    return element[property]
}
