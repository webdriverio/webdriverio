/**
 * You can use `call` to execute any async action within your test spec. The command itself
 * is treated like a synchronous function. It accepts promises and stops the execution until
 * the promise has resolved.
 *
 * <example>
    :call.js
    it('some testing here', function() {
        browser.url('http://google.com')

        // make an asynchronous call using any 3rd party library supporting promises
        // e.g. call to backend or db to inject fixture data
        browser.call(function () {
            return somePromiseLibrary.someMethod().then(function () {
                // ...
            })
        })

        // example for async call to 3rd party library that doesn't support promises
        browser.call(function () {
            return new Promise(function(resolve, reject) {
                someOtherNodeLibrary.someMethod(param1, function(err, res) {
                    if (err) {
                        return reject(err)
                    }

                    resolve(res)
                })
            })
        })

        // continue synchronously
        browser.click('#elemA')
        browser.setValue('.firstname','webdriverbot')
    });
 * </example>
 *
 * @alias browser.call
 * @param {Function} callback  function to be called
 * @type utility
 *
 */
