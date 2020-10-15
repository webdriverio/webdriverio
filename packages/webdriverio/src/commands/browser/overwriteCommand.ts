/**
 * The browser method `overwriteCommand` helps you to overwrite the browser's and element's native commands like `pause` and `click`.
 *
 * > You can view more info on `overwriteCommand` [here](https://webdriver.io/docs/customcommands.html#overwriting-native-commands)
 * <example>
    :execute.js
    //print milliseconds before pause and return its value.
    //pause           - name of command to be overwritten
    //origPauseFunction  - original pause function
    browser.overwriteCommand('pause', function (origPauseFunction, ms) {
        console.log(`Sleeping for ${ms}`)
        origPauseFunction(ms)
        return ms
    })
    //usage
    it('should use my overwrite command', () => {
        browser.url('https://webdriver.io')
        browser.pause(1000) //outputs "Sleeping for 1000"
    })
 * </example>

 * @alias browser.overwriteCommand
 * @param {String} name name of the original command
 * @param {Function} callback  pass original function
 * @param {Boolean=} elementScope extend the Element object instead of the Browser object
 * @type utility
 *
 */