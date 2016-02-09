/**
 * helper to detect a Selenium Grid according to given capabilities
 */
let detectSeleniumGrid = function (capabilities) {
    return !!capabilities.gridApiPath
}

export default detectSeleniumGrid
