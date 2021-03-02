/**
 * You can use `call` to execute any async action within your test spec. The command itself
 * is treated like a synchronous function. It accepts promises and stops the execution until
 * the promise has resolved.
 *
 * <example>
    :call.js
    it('some testing here', () => {
        browser.url('http://google.com')
        // make an asynchronous call using any 3rd party library supporting promises
        // e.g. call to backend or db to inject fixture data
        browser.call(() => {
            return somePromiseLibrary.someMethod().then(() => {
                // ...
            })
        })
        // example for async call to 3rd party library that doesn't support promises
        browser.call(() => {
            return new Promise((resolve, reject) => {
                someOtherNodeLibrary.someMethod(param1, (err, res) => {
                    if (err) {
                        return reject(err)
                    }
                    resolve(res)
                })
            })
        })
        // continue synchronously
        $('#elemA').click()
        $('.firstname').setValue('webdriverbot')
    });
 * </example>
 *
 * @alias browser.call
 * @param {Function} callback  function to be called
 * @type utility
 *
 */
export default function call<T> (fn: () => T) {
    if (typeof fn === 'function') {
        return fn()
    }

    throw new Error('Command argument for "call" needs to be a function')
}
