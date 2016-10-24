/**
 *
 * Add custom command to client/browser instance. Read more about `addCommand` [here](/guide/usage/customcommands.html).
 *
 * <example>
    :addCommandAsync.js
    // adding `async` as function name disables the synchronous behavior of WebdriverIO commands
    // in case you need to interact with other 3rd party libraries that support promises
    client.addCommand("getUrlAndTitle", function async (customVar) {
        return this.url().then(function(urlResult) {
            return this.getTitle().then(function(titleResult) {
                console.log(customVar); // "a custom variable"
                return { url: urlResult.value, title: titleResult }
            })
        })
    })

    :addCommand.js
    browser.addCommand("getUrlAndTitle", function (customVar) {
        return {
            url: this.getUrl(),
            title: this.getTitle(),
            customVar: customVar
        }
    })

    :example.js
    it('should use my custom command', function () {
        browser.url('http://www.github.com')
        var result = browser.getUrlAndTitle('foobar')

        assert.strictEqual(result.url, 'https://github.com/')
        assert.strictEqual(result.title, 'GitHub · Where software is built')
        assert.strictEqual(result.customVar, 'foobar')
    })
 * </example>
 *
 * @alias browser.addCommand
 * @param {String}   commandName   name of your custom command
 * @param {Function} customMethod  your custom method
 * @param {Boolean}  overwrite     if set to `true` you can overwrite existing commands
 * @type utility
 *
 */

// Nothing to see here!
// You can find the actual implementation in /lib/webdriverio.js
