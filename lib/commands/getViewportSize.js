/**
 *
 * Get viewport size of the current browser window. This command only works on desktop browser or in a mobile
 * environment with a webview enabled.
 *
 * <example>
    :getViewportSize.js
    it('should return the viewport size', function () {
        browser.url('http://webdriver.io');

        var size = browser.getViewportSize()
        console.log(size); // outputs: {width: 1024, height: 768}

        var width = browser.getViewportSize('width')
        console.log(size); // outputs: 1024

        var height = browser.getViewportSize('height');
        console.log(height); // outputs: 768
    });
 * </example>
 *
 * @alias browser.getViewportSize
 * @param {String} property  if "width" or "height" is set it returns only that property
 * @return {Object}  viewport width and height of the browser
 * @uses protocol/execute
 * @type window
 *
 */

import getViewportSizeHelper from '../scripts/getViewportSize'

let getViewportSize = function (prop) {
    return this.execute(getViewportSizeHelper).then((res) => {
        if (typeof prop === 'string' && prop.match(/(width|height)/)) {
            prop = 'screen' + prop.slice(0, 1).toUpperCase() + prop.slice(1)
            return res.value[prop]
        }

        return {
            width: res.value.screenWidth || 0,
            height: res.value.screenHeight || 0
        }
    })
}

export default getViewportSize
