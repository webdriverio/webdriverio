import { MockAgent, setGlobalDispatcher, getGlobalDispatcher, type Interceptable } from 'undici'
import type { CommandEndpoint, Protocol } from '@wdio/protocols'

import {
    WebDriverProtocol, MJsonWProtocol, AppiumProtocol,
    ChromiumProtocol, SauceLabsProtocol, SeleniumProtocol
} from '@wdio/protocols'

const REGEXP_SESSION_ID = /\/[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/
const SESSION_ID = 'XXX'
const protocols: Protocol[] = [
    WebDriverProtocol, MJsonWProtocol, AppiumProtocol,
    ChromiumProtocol, SauceLabsProtocol, SeleniumProtocol
]

type protocolFlattenedType = { method: string, endpoint: string, commandData: CommandEndpoint }
const protocolFlattened: Map<string, protocolFlattenedType> = new Map()

export interface CommandMock {
    [commandName: string]: (...args: unknown[]) => MockInterceptor
}

export interface MockInterceptor {
    times(n: number): MockInterceptor
    once(): MockInterceptor
    twice(): MockInterceptor
    reply(statusCode: number, data?: unknown | (() => unknown)): void
}

for (const protocol of protocols) {
    for (const [endpoint, methods] of Object.entries(protocol)) {
        for (const [method, commandData] of Object.entries(methods)) {
            protocolFlattened.set(commandData.command, { method, endpoint, commandData })
        }
    }
}

let sharedAgent: MockAgent | undefined

/**
 * Mock WebDriver on :4444, but still allow other localhost traffic
 * (e.g. `@wdio/shared-store-service` on an ephemeral port).
 */
function configureNetConnect(agent: MockAgent) {
    agent.disableNetConnect()
    agent.enableNetConnect((host) => !String(host).endsWith(':4444'))
}

function getOrCreateAgent(): MockAgent {
    if (!sharedAgent) {
        sharedAgent = new MockAgent()
        configureNetConnect(sharedAgent)
        setGlobalDispatcher(sharedAgent)
    }
    return sharedAgent
}

class UndiciMockInterceptor implements MockInterceptor {
    #times: number | null = null

    constructor(
        private readonly pool: Interceptable,
        private readonly opts: {
            path: (path: string) => boolean
            method: string
            body?: (body: Record<string, unknown>) => boolean
        }
    ) {}

    times(n: number) {
        this.#times = n
        return this
    }

    once() {
        return this.times(1)
    }

    twice() {
        return this.times(2)
    }

    reply(statusCode: number, data?: unknown | (() => unknown)) {
        const interceptOpts: Parameters<Interceptable['intercept']>[0] = {
            path: this.opts.path,
            method: this.opts.method,
        }
        if (this.opts.body) {
            interceptOpts.body = (body: string) => {
                try {
                    const parsed = typeof body === 'string' ? JSON.parse(body) : body
                    return this.opts.body!(parsed as Record<string, unknown>)
                } catch {
                    return false
                }
            }
        }

        const dataOrFn = typeof data === 'function'
            ? () => (data as () => unknown)()
            : data

        const mock = this.pool.intercept(interceptOpts).reply(statusCode, dataOrFn as never)
        if (this.#times === Infinity) {
            mock.persist()
        } else if (this.#times !== null && this.#times > 0) {
            mock.times(this.#times)
        }
        // undici defaults to a single reply when neither times() nor persist() is set
    }
}

export default class WebDriverMock {
    command: CommandMock
    #origin: string
    #pool: Interceptable

    constructor(host: string = 'localhost', port: number = 4444, public path: string = '/') {
        this.#origin = `http://${host}:${port}`
        const agent = getOrCreateAgent()
        this.#pool = agent.get(this.#origin)
        this.command = new Proxy({}, { get: this.get.bind(this) }) as unknown as CommandMock
    }

    /**
     * To allow random session IDs in url paths we have to set up a custom
     * matcher that strips out the sessionID part from the expected url
     * and actual url and replaces it with a constant session id
     * @param   {String}   expectedPath path to match against
     * @returns {Function}              to be called by the mock agent to match actual path
     */
    static pathMatcher(expectedPath: string): (path: string) => boolean {
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
            const normalizedExpected = expectedPath.replace(':sessionId', SESSION_ID)
            const normalizedPath = path.replace(`${sessionId[0].slice(1)}`, SESSION_ID)
            return normalizedPath === normalizedExpected
        }
    }

    get(_obj: unknown, commandName: string) {
        const { method, endpoint, commandData } = protocolFlattened.get(commandName) as protocolFlattenedType

        return (...args: unknown[]) => {
            let urlPath = endpoint
            for (const [i, param] of Object.entries(commandData.variables || [])) {
                urlPath = urlPath.replace(`:${param.name}`, args[parseInt(i)] as string)
            }

            const path = WebDriverMock.pathMatcher(urlPath)
            if (method === 'POST') {
                return new UndiciMockInterceptor(this.#pool, {
                    path,
                    method,
                    body: (body: Record<string, unknown>) => {
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
                    }
                })
            }

            return new UndiciMockInterceptor(this.#pool, { path, method })
        }
    }

    /**
     * Clear all interceptors and recreate the shared MockAgent.
     */
    static reset() {
        const previous = sharedAgent
        sharedAgent = new MockAgent()
        configureNetConnect(sharedAgent)
        setGlobalDispatcher(sharedAgent)
        if (previous) {
            void previous.close()
        }
        if (getGlobalDispatcher().constructor.name !== 'MockAgent') {
            setGlobalDispatcher(sharedAgent)
        }
    }
}
