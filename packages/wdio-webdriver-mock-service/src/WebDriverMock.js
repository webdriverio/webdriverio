import path from 'path'
import nock from 'nock'

import webdriver from 'webdriver'

import { SESSION_ID } from './constants'

const protocols = [
    webdriver.JsonWProtocol,
    webdriver.MJsonWProtocol,
    webdriver.AppiumProtocol,
    webdriver.ChromiumProtocol
]

const protocolFlattened = new Map()
for (const protocol of protocols) {
    for (const [endpoint, methods] of Object.entries(protocol)) {
        for (const [method, commandData] of Object.entries(methods)) {
            protocolFlattened.set(commandData.command, { method, endpoint, commandData })
        }
    }
}

export default class WebDriverMock {
    constructor (host = 'http://0.0.0.0', port = 4444, path = '/') {
        this.path = path
        this.scope = nock(`${host}:${port}`, { 'encodedQueryParams':true })
        this.command = new Proxy({}, { get: ::this.get })
    }

    get (obj, commandName) {
        const { method, endpoint, commandData } = protocolFlattened.get(commandName)

        return (...args) => {
            let urlPath = path.join(this.path, endpoint).replace(':sessionId', SESSION_ID)
            for (const [i, param] of Object.entries(commandData.variables || [])) {
                urlPath = urlPath.replace(`:${param.name}`, args[i])
            }

            return this.scope[method.toLowerCase()](urlPath)
        }
    }
}
