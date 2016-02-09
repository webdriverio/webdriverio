/**
 * helper to detect a Selenium Grid according to given capabilities
 */
let detectSeleniumGrid = function (capabilities) {
    return !!capabilities.gridPath
}

export default detectSeleniumGrid
