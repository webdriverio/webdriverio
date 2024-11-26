import os from 'node:os'
import ws from 'ws'

import WebDriver from './index.js'
import { FetchRequest } from './request/node.js'
import type { BrowserSocket } from './bidi/socket.js'

export default WebDriver
export * from './index.js'

import { environment } from './environment.js'

environment.value = {
    Request: FetchRequest,
    Socket: ws as unknown as typeof BrowserSocket,
    variables: {
        WEBDRIVER_CACHE_DIR: process.env.WEBDRIVER_CACHE_DIR || os.tmpdir(),
        PROXY_URL: process.env.HTTP_PROXY || process.env.HTTPS_PROXY
    }
}

