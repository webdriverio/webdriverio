import minimatch from 'minimatch'
// import logger from '@wdio/logger'

// const log = logger('NetworkInterception')

export default class NetworkInterception {
    constructor (url, customMockFn) {
        this.url = url
        this.customMockFn = customMockFn
        this.matches = new Set()
    }

    static handleRequestInterception (client, mocks) {
        return async (event) => {
            const { requestId, request } = event

            for (const mock of mocks) {
                /**
                 * continue if urls doen't match
                 */
                if (!minimatch(request.url, mock.url)) {
                    continue
                }

                /**
                 * give the user the ability to handle the mock manually
                 */
                if (typeof mock.customMockFn === 'function') {
                    return mock.customMockFn(client, event)
                }

                /**
                 * when request is modified
                 */
                if (mock.requestOverwrite) {
                    mock.matches.add(request)
                    return request.continue(mock.requestOverwrite)
                }

                /**
                 * when response is modified
                 */
                if (mock.respondOverwrite) {
                    mock.matches.add(request)

                    const { body, params } = mock.respondOverwrite
                    return client.send('Fetch.fulfillRequest', {
                        requestId,
                        responseCode: params.statusCode || event.responseStatusCode,
                        responseHeaders: [
                            ...event.responseHeaders,
                            ...Object.entries(params.headers || {}).map(([key, value]) => { key, value })
                        ],
                        body: Buffer.from(body).toString('base64')
                    })
                }

                /**
                 * when request is aborted
                 */
                if (mock.abortErrorCode) {
                    mock.matches.add(request)
                    return client.send('Fetch.failRequest', {
                        requestId,
                        errorReason: mock.abortErrorCode
                    })
                }
            }

            return client.send('Fetch.continueRequest', { requestId })
        }
    }

    mockRestore () {
        delete this.requestOverwrite
        delete this.respondOverwrite
    }

    request (requestOverwrite) {
        this.requestOverwrite = requestOverwrite
    }

    respond (respondOverwrite, params = {}) {
        let body = respondOverwrite
        if (typeof respondOverwrite !== 'string') {
            body = JSON.stringify(respondOverwrite)
        }
        this.respondOverwrite = { body, params }
    }

    abort (errorCode) {
        this.abortErrorCode = errorCode
    }
}
