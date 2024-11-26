import WebDriver from './index.js'
import { BrowserSocket } from './bidi/socket.js'
import { FetchRequest } from './request/web.js'

export default WebDriver
export * from './index.js'

import { environment } from './environment.js'

environment.value = {
    Request: FetchRequest,
    Socket: BrowserSocket,
    variables: {}
}

