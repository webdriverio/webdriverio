/**
 * The browser method `overwriteCommand` helps you to overwrite the browser's and element's native commands like `pause` and `click`.
 *
 * :::info
 *
 * You can view more information on this in the [custom command](/docs/customcommands#overwriting-native-commands) section.
 *
 * :::
 *
 * <example>
    :execute.js
    // print milliseconds before pause and return its value.
    await browser.overwriteCommand('pause', function (origPauseFunction, ms) {
        console.log(`Sleeping for ${ms}`)
        origPauseFunction(ms)
        return ms
    })

    // usage
    it('should use my overwrite command', async () => {
        await browser.url('https://webdriver.io')
        await browser.pause(1000) // outputs "Sleeping for 1000"
    })
 * </example>
 * @alias browser.overwriteCommand
 * @param {string} name name of the original command
 * @param {Function} callback  pass original function
 * @param {Boolean=} elementScope extend the Element object instead of the Browser object
 * @type utility
 *
 */
