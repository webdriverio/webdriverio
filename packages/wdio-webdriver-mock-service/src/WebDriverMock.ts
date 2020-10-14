import nock from 'nock'

import {
    WebDriverProtocol, MJsonWProtocol, JsonWProtocol, AppiumProtocol,
    ChromiumProtocol, SauceLabsProtocol, SeleniumProtocol
} from '@wdio/protocols'

const REGEXP_SESSION_ID = /\/[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/
const SESSION_ID = 'XXX'
const protocols = [
    JsonWProtocol, WebDriverProtocol, MJsonWProtocol, AppiumProtocol,
    ChromiumProtocol, SauceLabsProtocol, SeleniumProtocol
]

const protocolFlattened = new Map<string, { method: string, endpoint: string, commandData: WDIOProtocols.CommandEndpoint }>()

for (const protocol of protocols) {
    for (const [endpoint, methods] of Object.entries(protocol)) {
        for (const [method, commandData] of Object.entries(methods)) {
            protocolFlattened.set(commandData.command, { method, endpoint, commandData })
        }
    }
}

export default class WebDriverMock {
    command: ProxyConstructor
    path: string
    scope: any
    constructor(host: string = 'localhost', port: number = 4444, path: string = '/') {
        this.path = path
        this.scope = nock(`http://${host}:${port}`, { 'encodedQueryParams': true })
        this.command = new Proxy({}, { get: this.get.bind(this) })
    }

    /**
     * To allow random session IDs in url paths we have to set up a custom
     * matcher that strips out the sessionID part from the expected url
     * and actual url and replaces it with a constant session id
     * @param   {String}   expectedPath path to match against
     * @returns {Function}              to be called by Nock to match actual path
     */
    static pathMatcher(expectedPath: string): Function {
        return (path: string) => {
            const sessionId = path.match(REGEXP_SESSION_ID)

            /**
             * no session ID found so we can check against expected path directly
             */
            if (!sessionId) {
                return path === expectedPath
            }

            /**
             * remove the session ID from expected and actual path
             * to only compare non arbitrary parts
             */
            expectedPath = expectedPath.replace(':sessionId', SESSION_ID)
            path = path.replace(`${sessionId[0].slice(1)}`, SESSION_ID)
            return path === expectedPath
        }
    }

    get(obj: any, commandName: string) {

        const protocolFltattenedValues = protocolFlattened.get(commandName)
        const method = protocolFltattenedValues!.method
        const endpoint = protocolFltattenedValues!.endpoint
        const commandData = protocolFltattenedValues!.commandData

        return (...args: any[]) => {
            let urlPath = endpoint
            for (const [i, param] of Object.entries(commandData.variables || [])) {
                urlPath = urlPath.replace(`:${param.name}`, args[parseInt(i)])
            }

            if (method === 'POST') {
                return this.scope[method.toLowerCase()](WebDriverMock.pathMatcher(urlPath), (body: Record<string, any>) => {
                    for (const param of commandData.parameters) {
                        /**
                         * check if parameter was set
                         */
                        if (!body[param.name]) {
                            return false
                        }

                        /**
                         * check if parameter has correct type
                         */
                        if (param.required && typeof body[param.name] === 'undefined') {
                            return false
                        }
                    }

                    /**
                     * all parameters are valid
                     */
                    return true
                })
            }

            return this.scope[method.toLowerCase()](WebDriverMock.pathMatcher(urlPath))
        }
    }
}
