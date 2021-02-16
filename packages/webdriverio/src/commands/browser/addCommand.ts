/**
 * The browser method  `addCommand` helps you to write your own set of commands. You can write your command in a synchronous way or in an asynchronous way.
 *
 * :::info
 *
 * You can find more information on adding custom commands in the [custom command](/docs/customcommands#adding-custom-commands) guide.
 *
 * :::
 *
 * <example>
    :execute.js
    browser.addCommand('getUrlAndTitle', function (customParam) {
        // `this` refers to the `browser` scope
        return {
            url: this.getUrl(),
            title: this.getTitle(),
            customParam: customParam
        }
    })
    //usage
    it('should use my add command', () => {
        browser.url('https://webdriver.io')
        const result = browser.getUrlAndTitle('foobar')

        assert.strictEqual(result.url, 'https://webdriver.io')
        assert.strictEqual(result.title, 'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
        assert.strictEqual(result.customParam, 'foobar')
    })
 * </example>
 * @alias browser.addCommand
 * @param {String} name name of the custom command
 * @param {Function} callback  function to be called
 * @param {Boolean=} elementScope extend the Element object instead of the Browser object
 * @type utility
 *
 */
