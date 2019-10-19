/**
 * Injector script for executeAyncScript command.
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
export default (_, script, scriptTimeout, dataProperty, dataFlag, ...commandArgs) => {
    return new Promise((_resolve, _reject) => {
        setTimeout(
            () => _reject('script timeout'),
            scriptTimeout
        )

        window.arguments = [...commandArgs, (result) => {
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

            return _resolve(isResultArray ? tmpResult : tmpResult[0])
        }]

        return eval(script.slice(7))
    })
}
