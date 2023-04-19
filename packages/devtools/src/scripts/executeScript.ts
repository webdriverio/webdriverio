/**
 * injector script for executeScript command
 * According to the WebDriver spec we need to ensure to serialize all elements
 * being returned from the script. In order to do so we attach a data attribute
 * to them and fetch them using Puppeteer after the script execution. Instead
 * of the element we return the dataFlag string instead to signalize that this
 * is suppose to be an element handle
 *
 * @param  {HTMLElement} _            $eval fetched element
 * @param  {string}      script       user script
 * @param  {string}      dataProperty property name for elements being returned
 * @param  {string}      dataFlag     flag for element
 * @param  {Object[]}    args         user arguments for custom script
 * @return {Object}                   result of custom script
 */
export default (_: HTMLElement, script: string, dataProperty: string, dataFlag: string, ...args: any[]) => {
    (window as any).arguments = args
    const result = eval(script)
    let tmpResult = result instanceof NodeList ? Array.from(result) : result
    const isResultArray = Array.isArray(tmpResult)
    tmpResult = isResultArray ? tmpResult : [tmpResult]

    if (tmpResult.find((r: any) => r instanceof HTMLElement)) {
        tmpResult = tmpResult.map((r: any, i: number) => {
            if (r instanceof HTMLElement) {
                const dataPropertyValue = `${dataFlag}_${i}`
                r.setAttribute(dataProperty, dataPropertyValue)
                return dataPropertyValue
            }

            return r
        })
    }

    return isResultArray ? tmpResult : tmpResult[0]
}
