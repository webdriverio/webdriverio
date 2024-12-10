import type { BrowserSocket } from './bidi/socket.js'
import type { FetchRequest } from './request/web.js'

/**
 * @internal
 */
export const isNode = !!(typeof process !== 'undefined' && process.version)

export interface EnvironmentVariables {
    WEBDRIVER_CACHE_DIR?: string
    PROXY_URL?: string
}

export interface EnvironmentDependencies {
    Request: typeof FetchRequest,
    Socket: typeof BrowserSocket,
    variables: EnvironmentVariables
}

/**
 * Holder for environment dependencies. These dependencies cannot
 * be used during the module instantiation.
 */
export const environment: {
    value: EnvironmentDependencies;
} = {
    value: {
        get Request(): EnvironmentDependencies['Request'] {
            throw new Error('Request is not available in this environment')
        },
        get Socket(): EnvironmentDependencies['Socket'] {
            throw new Error('Socket is not available in this environment')
        },
        get variables(): EnvironmentDependencies['variables'] {
            return {}
        }
    }
}
