"use strict";

/**
 *
 * Add custom command to client/browser instance. Read more about `addCommand` [here](/guide/usage/customcommands.html).
 *
 * <example>
    :addCommandAsync.js
    client.addCommand("getUrlAndTitle", function async (customVar) {
        return this.url().then(function(urlResult) {
            return this.getTitle().then(function(titleResult) {
                console.log(customVar); // "a custom variable"
                return { url: urlResult.value, title: titleResult };
            });
        });
    });

    :addCommandSync.js
    browser.addCommand("getUrlAndTitle", function (customVar) {
        return {
            url: this.getUrl(),
            title: this.getTitle(),
            customVar: customVar
        };
    });

    :asyncExample.js
    client
        .init()
        .url('http://www.github.com')
        .getUrlAndTitle('a custom variable').then(function(result){
            assert.strictEqual(result.url,'https://github.com/');
            assert.strictEqual(result.title,'GitHub · Build software better, together.');
        })
        .end();

    :syncExample.js
    it('should use my custom command', function () {
        browser.url('http://www.github.com');
        var result = browser.getUrlAndTitle('foobar');

        assert.strictEqual(result.url, 'https://github.com/');
        assert.strictEqual(result.title, 'GitHub · Where software is built');
        assert.strictEqual(result.customVar, 'foobar');
    });
 * </example>
 *
 * @param {String}   commandName   name of your custom command
 * @param {Function} customMethod  your custom method
 * @param {Boolean}  overwrite     if set to `true` you can overwrite existing commands
 * @type utility
 *
 */

// Nothing to see here!
// You can find the actual implementation in /lib/webdriverio.js
