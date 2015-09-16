import url from 'url'
import request from 'request'
import merge from 'deepmerge'

import errorCodes from '../helper/constants'
import RuntimeError from './ErrorHandler'
import pkg from '../../package.json'

/**
 * RequestHandler
 */
class RequestHandler {
    constructor (options, eventHandler, logger) {
        this.sessionID = null
        this.startPath = options.path === '/' ? '' : options.path || '/wd/hub'
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
        if (requestOptions.path.match(/\:sessionId/) && !this.sessionID && requestOptions.requiresSession !== false) {
            // throw session id error
            throw new RuntimeError(101)
        }

        newOptions.uri = url.parse(
            this.defaultOptions.protocol + '://' +
            this.defaultOptions.hostname + ':' + this.defaultOptions.port +
            this.startPath +
            requestOptions.path.replace(':sessionId', this.sessionID || ''))

        // send authentication credentials only when creating new session
        if (requestOptions.path === '/session' && this.auth !== undefined) {
            newOptions.auth = this.auth
        }

        if (requestOptions.method) {
            newOptions.method = requestOptions.method
        }

        newOptions.json = true
        newOptions.followAllRedirects = true

        newOptions.headers = {
            'Connection': 'keep-alive',
            'Accept': 'application/json',
            'User-Agent': 'webdriverio/webdriverio/' + pkg.version
        }

        if (Object.keys(data).length > 0) {
            let requestData = JSON.stringify(data)
            newOptions.body = requestData
            newOptions.method = 'POST'
            newOptions.headers = merge(newOptions.headers, {
                'Content-Type': 'application/json; charset=UTF-8',
                'Content-Length': Buffer.byteLength(requestData, 'UTF-8')
            })
        }

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

        return new Promise((resolve, reject) => {
            request(fullRequestOptions, this.responseHandler(this, resolve, reject, data, requestOptions, fullRequestOptions))
        })
    }

    /**
     * response handler
     */
    responseHandler (resolve, reject, data, requestOptions, fullRequestOptions) {
        return (err, response, body) => {
            let error = null

            if (err || (body && body.status !== 0)) {
                if (body && typeof body === 'string') {
                    error = new RuntimeError(body)
                } else if (body) {
                    error = new RuntimeError({
                        status: body.status,
                        type: errorCodes[body.status] ? errorCodes[body.status].id : 'unknown',
                        message: errorCodes[body.status] ? errorCodes[body.status].message : 'unknown',
                        orgStatusMessage: body.value ? body.value.message : ''
                    })
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

                this.logger.log('SET SESSION ID ' + this.sessionID)
            }

            if (body === undefined) {
                body = {
                    status: 0,
                    orgStatusMessage: errorCodes[0].message
                }
            }

            this.eventHandler.emit('result', {
                requestData: data,
                requestOptions: fullRequestOptions,
                response: response,
                body: body
            })

            return resolve(body)
        }
    }
}

export default RequestHandler
