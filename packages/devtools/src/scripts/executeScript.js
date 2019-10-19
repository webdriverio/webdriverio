/**
 * Injector script for executeScript command.
 *
 * According to the WebDriver spec, we must be sure to serialize all elements
 * returned from the script. In order to do so, we attach a data attribute
 * to them and fetch them using Puppeteer after the script execution. Instead
 * of the element, we return the dataFlag string to signify that this
 * is suppose to be an element handle.
 *
 * @param  {HTMLElement} _            - $eval fetched element
 * @param  {String}      script       - User script
 * @param  {String}      dataProperty - Property name for elements being returned
 * @param  {String}      dataFlag     - Flag for element
 * @param  {Object[]}    args         - User arguments for custom script
 * @return {Object} - Result of custom script
 */
export default (_, script, dataProperty, dataFlag, ...args) => {
    window.arguments = args
    const result = eval(script.slice(7))
    let tmpResult = result instanceof NodeList ? Array.from(result) : result
    const isResultArray = Array.isArray(tmpResult)
    tmpResult = isResultArray ? tmpResult : [tmpResult]

    if (tmpResult.find((r) => r instanceof HTMLElement)) {
        tmpResult = tmpResult.map((r, i) => {
            if (r instanceof HTMLElement) {
                const dataPropertyValue = `${dataFlag}_${i}`
                r.setAttribute(dataProperty, dataPropertyValue)
                return dataPropertyValue
            }

            return result
        })
    }

    return isResultArray ? tmpResult : tmpResult[0]
}
