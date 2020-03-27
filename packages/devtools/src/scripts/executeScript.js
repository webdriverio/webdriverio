/**
 * injector script for executeScript command
 * According to the WebDriver spec we need to ensure to serialize all elements
 * being returned from the script. In order to do so we attach a data attribute
 * to them and fetch them using Puppeteer after the script execution. Instead
 * of the element we return the dataFlag string instead to signalise that this
 * is suppose to be an element handle
 *
 * @param  {HTMLElement} _            $eval fetched element
 * @param  {String}      script       user script
 * @param  {String}      dataProperty property name for elements being returned
 * @param  {String}      dataFlag     flag for element
 * @param  {Object[]}    args         user arguments for custom script
 * @return {Object}                   result of custom script
 */
export default (_, script, dataProperty, dataFlag, ...args) => {
    window.arguments = args
    const result = eval(script)
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
