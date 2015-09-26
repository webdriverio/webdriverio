/**
 *
 * Add custom command to client/browser instance. Read more about `addCommand` [here](/guide/usage/customcommands.html).
 *
 * <example>
    :addCommand.js
    client.addCommand("getUrlAndTitle", function(customVar) {
        return this.url().then(function(urlResult) {
            return this.getTitle().then(function(titleResult) {
                console.log(customVar); // "a custom variable"
                return { url: urlResult.value, title: titleResult };
            });
        });
    });
    &nbsp;
    client
        .init()
        .url('http://www.github.com')
        .getUrlAndTitle('a custom variable',function(err,result){
            assert.equal(null, err)
            assert.strictEqual(result.url,'https://github.com/');
            assert.strictEqual(result.title,'GitHub · Build software better, together.');
        })
        .end();
 * </example>
 *
 * @param {String}   commandName   name of your custom command
 * @param {Function} customMethod  your custom method
 * @param {Boolean}  overwrite     if set to `true` you can overwrite existing commands
 * @type utility
 *
 */

// Nothing to see here!
// You can find the Actual implementation in /lib/webdriverio.js
