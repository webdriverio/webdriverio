/**
 * Set http request options
 *
 * <example>
    :configureHttp.js
    client
        .init()
        .url('http://google.com')
        // ... other commands
        .configureHttp({ // configuring of next requests
            connectionRetryCount: 1,
            connectionRetryTimeout: 5000
        })
        .end() // timeout on closing of a session will be 5000 ms with 1 retry
 * </example>
 *
 * @param {Object} opts request options (`{protocol: string, hostname: string, port: string, connectionRetryTimeout: number, connectionRetryCount: number}`)
 * @type utility
 */

let configureHttp = function (opts) {
    Object.assign(this.requestHandler.defaultOptions, opts)
}

export default configureHttp
