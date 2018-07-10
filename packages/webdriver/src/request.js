import url from 'url'
import http from 'http'
import path from 'path'
import https from 'https'
import request from 'request'
import logger from 'wdio-logger'
import EventEmitter from 'events'

import { isSuccessfulResponse } from './utils'
import pkg from '../package.json'

const log = logger('webdriver')
const agents = {
    http: new http.Agent({ keepAlive: true }),
    https: new https.Agent({ keepAlive: true })
}

export default class WebDriverRequest extends EventEmitter {
    constructor (method, endpoint, body) {
        super()
        this.method = method
        this.endpoint = endpoint
        this.defaultOptions = {
            method,
            body,
            followAllRedirects: true,
            json: true,
            headers: {
                'Connection': 'keep-alive',
                'Accept': 'application/json',
                'User-Agent': 'webdriver/' + pkg.version
            }
        }
    }

    makeRequest (options, sessionId) {
        const fullRequestOptions = Object.assign(this.defaultOptions, this._createOptions(options, sessionId))
        this.emit('request', fullRequestOptions)
        return this._request(fullRequestOptions, options.connectionRetryCount)
    }

    _createOptions (options, sessionId) {
        const requestOptions = {
            agent: agents[options.protocol],
            headers: typeof options.headers === 'object' ? options.headers : {},
            qs: typeof this.defaultOptions.queryParams === 'object' ? options.queryParams : {}
        }

        /**
         * if we don't have a session id we set it here, unless we call commands that don't require session ids, for
         * example /sessions. The call to /sessions is not connected to a session itself and it therefore doesn't
         * require it
         */
        if (this.endpoint.match(/:sessionId/) && !sessionId) {
            throw new Error('A sessionId is required for this command')
        }

        requestOptions.uri = url.parse(
            `${options.protocol}://` +
            `${options.hostname}:${options.port}` +
            path.resolve(`${options.path}${this.endpoint.replace(':sessionId', sessionId)}`)
        )

        /**
         * send authentication credentials only when creating new session
         */
        if (this.endpoint === '/session' && options.user && options.key) {
            requestOptions.auth = {
                user: options.user,
                pass: options.key
            }
        }

        return requestOptions
    }

    _request (fullRequestOptions, totalRetryCount = 0, retryCount = 0) {
        log.info(`[${fullRequestOptions.method}] ${fullRequestOptions.uri.href}`)

        if (fullRequestOptions.body && Object.keys(fullRequestOptions.body).length) {
            log.info('DATA', fullRequestOptions.body)
        }

        return new Promise((resolve, reject) => request(fullRequestOptions, (err, response, body) => {
            const error = new Error(err || (body.value ? body.value.message : body))

            /**
             * Resolve only if successful response
             */
            if (!err && isSuccessfulResponse(response)) {
                this.emit('response', { result: body })
                return resolve(body)
            }

            if (retryCount >= totalRetryCount) {
                log.error('Request failed after retry due to', error)
                this.emit('response', { error })
                return reject(error)
            }

            ++retryCount
            this.emit('retry', { error, retryCount })
            log.warn('Request failed due to', error.message)
            log.info(`Retrying ${retryCount}/${totalRetryCount}`)
            this._request(fullRequestOptions, totalRetryCount, retryCount).then(resolve, reject)
        }))
    }
}
