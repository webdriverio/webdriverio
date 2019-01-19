import url from 'url'
import http from 'http'
import https from 'https'
import request from 'request'
import merge from 'deepmerge'

import { ERROR_CODES } from '../helpers/constants'
import { isSuccessfulResponse, formatHostname, isUnknownCommand } from '../helpers/utilities'
import { RuntimeError } from './ErrorHandler'
import pkg from '../../package.json'

const httpAgent = new http.Agent({ keepAlive: true })
const httpsAgent = new https.Agent({ keepAlive: true })

/**
 * RequestHandler
 */
class RequestHandler {
    constructor (options, eventHandler, logger) {
        this.sessionID = null
        this.startPath = options.path === '/' ? '' : options.path || '/wd/hub'
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

        // Add query parameters to request options if it is an object
        if (typeof this.defaultOptions.queryParams === 'object') {
            newOptions.qs = this.defaultOptions.queryParams
        }

        this.defaultOptions.protocol = this.defaultOptions.protocol || 'http'

        newOptions.uri = url.parse(
            this.defaultOptions.protocol + '://' +
            formatHostname(this.defaultOptions.hostname) + ':' + this.defaultOptions.port +
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

        if (this.defaultOptions.agent) {
            newOptions.agent = this.defaultOptions.agent
        } else if (this.defaultOptions.protocol === 'http') {
            newOptions.agent = httpAgent
        } else if (this.defaultOptions.protocol === 'https') {
            newOptions.agent = httpsAgent
        } else {
            throw new RuntimeError('Unsupported protocol, must be http or https: ' +
                this.defaultOptions.protocol)
        }

        newOptions.headers = {
            'Connection': 'keep-alive',
            'Accept': 'application/json',
            'User-Agent': 'webdriverio/webdriverio/' + pkg.version
        }

        // Check for custom authorization header
        if (typeof this.defaultOptions.headers === 'object') {
            Object.keys(this.defaultOptions.headers).forEach(header => {
                if (typeof this.defaultOptions.headers[header] === 'string') {
                    newOptions.headers[header] = this.defaultOptions.headers[header]
                }
            })
        }

        if (Object.keys(data).length > 0) {
            newOptions.json = data
            newOptions.method = 'POST'
            newOptions.headers = merge(newOptions.headers, {
                'Content-Type': 'application/json; charset=UTF-8',
                'Content-Length': Buffer.byteLength(JSON.stringify(data), 'UTF-8')
            })
        } else if (requestOptions.method === 'POST') {
            newOptions.json = {}
        }

        newOptions.timeout = this.defaultOptions.connectionRetryTimeout
        newOptions.proxy = this.defaultOptions.proxy

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

        return this.request(fullRequestOptions, this.defaultOptions.connectionRetryCount).then(({body, response}) => {
            /**
             * if no session id was set before we've called the init command
             */
            if (this.sessionID === null && requestOptions.requiresSession !== false) {
                this.sessionID = body.sessionId || body.value.sessionId

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

    request (fullRequestOptions, totalRetryCount, retryCount = 0) {
        return new Promise((resolve, reject) => {
            request(fullRequestOptions, (err, response, body) => {
                /**
                 * Resolve only if successful response
                 */
                if (!err && isSuccessfulResponse(response)) {
                    return resolve({body, response})
                }

                if (fullRequestOptions.gridCommand) {
                    if (body && body.success) {
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
                    const errorCode = ERROR_CODES[body.status] || (body.value && ERROR_CODES[body.value.error]) || ERROR_CODES[-1]
                    let error = {
                        type: errorCode ? errorCode.id : 'unknown',
                        message: errorCode ? errorCode.message : 'unknown',
                        orgStatusMessage: body.value ? body.value.message : ''
                    }
                    let screenshot = body.value && body.value.screen

                    if (screenshot) {
                        error.screenshot = screenshot
                    }

                    return reject(new RuntimeError(error))
                }

                // IEServer webdriver bug where the error is put into the Allow header
                // https://github.com/SeleniumHQ/selenium/issues/6828
                if (response && response.statusCode === 405) {
                    let allowHeader = response.headers && response.headers.allow
                    let err = new RuntimeError(allowHeader)
                    if (isUnknownCommand(err)) {
                        return reject(err)
                    }
                }

                if (retryCount >= totalRetryCount) {
                    const message = 'Couldn\'t connect to selenium server'
                    const status = -1
                    const type = 'ECONNREFUSED'

                    if (err && err.message.indexOf('Nock') > -1) {
                        // for better unit test error output
                        return reject(err)
                    }

                    if (err) {
                        return reject(new RuntimeError({
                            status,
                            type: err.code || type,
                            orgStatusMessage: err.message,
                            message
                        }))
                    }

                    return reject(new RuntimeError({ status, type, message }))
                }

                this.request(fullRequestOptions, totalRetryCount, ++retryCount)
                    .then(resolve)
                    .catch(reject)
            })
        })
    }
}

export default RequestHandler
