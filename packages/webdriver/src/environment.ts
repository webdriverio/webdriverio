import type WebSocket from 'ws'
import type { Options } from '@wdio/types'

import type { BrowserSocket } from './bidi/socket.js'
import type { FetchRequest } from './request/web.js'

/**
 * @internal
 */
export const isNode = !!(typeof process !== 'undefined' && process.version)

export interface EnvironmentVariables {
    WEBDRIVER_CACHE_DIR?: string
    WDIO_LOG_LEVEL?: Options.WebDriverLogTypes
    PROXY_URL?: string
    NO_PROXY?: string[]
    DISABLE_WEBDRIVERIO_DEPRECATION_WARNINGS?: string
    WDIO_WORKER_ID?: string
    WDIO_UNIT_TESTS?: string
}

export interface EnvironmentDependencies {
    Request: typeof FetchRequest,
    Socket: typeof BrowserSocket,
    createBidiConnection: (wsUrl?: string, options?: WebSocket.ClientOptions) => Promise<WebSocket | undefined>,
    killDriverProcess: (capabilities: WebdriverIO.Capabilities, shutdownDriver: boolean) => void,
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
        get createBidiConnection(): EnvironmentDependencies['createBidiConnection'] {
            throw new Error('createBidiConnection is not available in this environment')
        },
        get killDriverProcess(): EnvironmentDependencies['killDriverProcess'] {
            throw new Error('killDriverProcess is not available in this environment')
        },
        get variables(): EnvironmentDependencies['variables'] {
            return {} as EnvironmentVariables
        }
    }
}
