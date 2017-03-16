import url from 'url'
import request from 'request'
import merge from 'deepmerge'

import { ERROR_CODES } from '../helpers/constants'
import { RuntimeError } from './ErrorHandler'
import pkg from '../../package.json'

/**
 * RequestHandler
 */
class RequestHandler {
    constructor (options, eventHandler, logger) {
        this.sessionID = null
        this.startPath = options.path === '/' ? '' : options.path || '/wd/hub'
            this.selenoid = options.selenoid
        this.gridApiStartPath = '/grid/api'
        this.eventHandler = eventHandler
        this.logger = logger
        this.defaultOptions = options

        /**
         * actually host is `hostname:port` but to keep config properties
         * short we abuse host as hostname
         */
        if (options.host !== undefined) {
            options.hostname = options.host
            delete options.host
        }

        /**
         * set auth from user and password configs
         */
        if (this.defaultOptions.user && this.defaultOptions.key) {
            this.auth = {
                user: this.defaultOptions.user,
                pass: this.defaultOptions.key
            }

            delete this.defaultOptions.user
            delete this.defaultOptions.key
        }
    }

    /**
     * merges default options with request options
     *
     * @param  {Object} requestOptions  request options
     */
    createOptions (requestOptions, data) {
        let newOptions = {}

        /**
         * if we don't have a session id we set it here, unless we call commands that don't require session ids, for
         * example /sessions. The call to /sessions is not connected to a session itself and it therefore doesn't
         * require it
         */
        if (requestOptions.path.match(/:sessionId/) && !this.sessionID && requestOptions.requiresSession !== false) {
            // throw session id error
            throw new RuntimeError(101)
        }

        newOptions.uri = url.parse(
            this.defaultOptions.protocol + '://' +
            this.defaultOptions.hostname + ':' + this.defaultOptions.port +
            (requestOptions.gridCommand ? this.gridApiStartPath : this.startPath) +
            requestOptions.path.replace(':sessionId', this.sessionID || ''))

        // send authentication credentials only when creating new session
        if (requestOptions.path === '/session' && this.auth !== undefined) {
            newOptions.auth = this.auth
        }

        if (requestOptions.method) {
            newOptions.method = requestOptions.method
        }

        if (requestOptions.gridCommand) {
            newOptions.gridCommand = requestOptions.gridCommand
        }

        newOptions.json = true
        newOptions.followAllRedirects = true

        newOptions.headers = {
            'Connection': 'keep-alive',
            'Accept': 'application/json',
            'User-Agent': 'webdriverio/webdriverio/' + pkg.version
        }

        if (Object.keys(data).length > 0) {
            newOptions.json = data
            newOptions.method = 'POST'
            newOptions.headers = merge(newOptions.headers, {
                'Content-Type': 'application/json; charset=UTF-8',
                'Content-Length': Buffer.byteLength(JSON.stringify(data), 'UTF-8')
            })
        }

        newOptions.timeout = this.defaultOptions.connectionRetryTimeout

        return newOptions
    }

    /**
     * creates a http request with its given options and send the protocol
     * command to the webdriver server
     *
     * @param  {Object}   requestOptions  defines url, method and other request options
     * @param  {Object}   data            contains request data
     */
    create (requestOptions, data) {
        data = data || {}

        /**
         * allow to pass a string as shorthand argument
         */
        if (typeof requestOptions === 'string') {
            requestOptions = {
                path: requestOptions
            }
        }

        let fullRequestOptions = this.createOptions(requestOptions, data)

        this.eventHandler.emit('command', {
            method: fullRequestOptions.method || 'GET',
            uri: fullRequestOptions.uri,
            data: data
        })

        return this.request(fullRequestOptions, this.defaultOptions).then(({body, response}) => {
            /**
             * if no session id was set before we've called the init command
             */
            if (this.sessionID === null && requestOptions.requiresSession !== false) {
                this.sessionID = body.sessionId

                this.eventHandler.emit('init', {
                    sessionID: this.sessionID,
                    options: body.value,
                    desiredCapabilities: data.desiredCapabilities
                })

                this.eventHandler.emit('info', 'SET SESSION ID ' + this.sessionID)
            }

            if (body === undefined) {
                body = {
                    status: 0,
                    orgStatusMessage: ERROR_CODES[0].message
                }
            }

            this.eventHandler.emit('result', {
                requestData: data,
                requestOptions: fullRequestOptions,
                response: response,
                body: body
            })

            return body
        }, (err) => {
            this.eventHandler.emit('result', {
                requestData: data,
                requestOptions: fullRequestOptions,
                body: err
            })
            throw err
        })
    }

    request (fullRequestOptions, defaultOptions, retryCount = 0) {
        var totalRetryCount = defaultOptions.connectionRetryCount;

        return new Promise((resolve, reject) => {
            request(fullRequestOptions, (err, response, body) => {
                /**
                 * Resolve with a healthy response
                 */

                if (!err && body) {
                    if ((defaultOptions.useW3C && defaultOptions.desiredCapabilities.browserName === 'firefox' && !body.error) || body.status === 0) {
                        return resolve({body: body, response: response});
                    }
                }

                if (fullRequestOptions.gridCommand) {
                    if (body.success) {
                        return resolve({body, response})
                    }

                    return reject(new RuntimeError({
                        status: 102,
                        type: ERROR_CODES[102].id,
                        message: ERROR_CODES[102].message,
                        orgStatusMessage: body.msg || 'unknown'
                    }))
                }

                /**
                 * in Appium you find sometimes more exact error messages in origValue
                 */
                if (body && body.value && typeof body.value.origValue === 'string' && typeof body.value.message === 'string') {
                    body.value.message += ' ' + body.value.origValue
                }

                if (body && typeof body === 'string') {
                    return reject(new RuntimeError(body))
                }

                if (body) {
                    let error = {
                        status: body.status || '-1',
                        type: ERROR_CODES[body.status] ? ERROR_CODES[body.status].id : 'unknown',
                        message: body.error || (ERROR_CODES[body.status] ? ERROR_CODES[body.status].message : 'unknown'),
                        orgStatusMessage: body.message || (body.value ? body.value.message : '')
                    }
                    let screenshot = body.value && body.value.screen

                    if (screenshot) {
                        error.screenshot = screenshot
                    }

                    return reject(new RuntimeError(error))
                }

                if (retryCount >= totalRetryCount) {
                    let error = null

                    if (err && err.message.indexOf('Nock') > -1) {
                        // for better unit test error output
                        error = err
                    } else {
                        error = new RuntimeError({
                            status: -1,
                            type: 'ECONNREFUSED',
                            message: 'Couldn\'t connect to selenium server',
                            orgStatusMessage: 'Couldn\'t connect to selenium server'
                        })
                    }

                    return reject(error)
                }

                this.request(fullRequestOptions, totalRetryCount, ++retryCount)
                    .then(resolve)
                    .catch(reject)
            })
        })
    }
}

export default RequestHandler
