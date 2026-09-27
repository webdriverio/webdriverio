import os from 'node:os'
import ws from 'ws'
import type { Options } from '@wdio/types'

import WebDriver from './index.js'
import { FetchRequest } from './request/node.js'
import { FetchRequest as WebFetchRequest } from './request/web.js'
import { createBidiConnection } from './node/bidi.js'
import { killDriverProcess } from './node/utils.js'
import type { BrowserSocket } from './bidi/socket.js'

export default WebDriver
export * from './index.js'

import { environment } from './environment.js'

environment.value = {
    Request: (
        /**
         * Prefer undici MockAgent (set by `@wdio/webdriver-mock-service`) when opted in.
         * Otherwise unit tests and explicit native-fetch runs use the web `fetch` impl.
         */
        process.env.WDIO_USE_UNDICI_MOCK
            ? FetchRequest
            : (
                process.env.WDIO_USE_NATIVE_FETCH ||
                process.env.WDIO_UNIT_TESTS
            )
                ? WebFetchRequest
                : FetchRequest
    ),
    Socket: ws as unknown as typeof BrowserSocket,
    createBidiConnection,
    killDriverProcess,
    variables: {
        WDIO_LOG_LEVEL: process.env.WDIO_LOG_LEVEL as Options.WebDriverLogTypes | undefined,
        WDIO_UNIT_TESTS: process.env.WDIO_UNIT_TESTS,
        WEBDRIVER_CACHE_DIR: process.env.WEBDRIVER_CACHE_DIR || os.tmpdir(),
        PROXY_URL: process.env.HTTP_PROXY || process.env.HTTPS_PROXY,
        NO_PROXY: process.env.NO_PROXY && process.env.NO_PROXY.trim()
            ? process.env.NO_PROXY.trim().split(/[\s,;]+/)
            : []
    }
}

