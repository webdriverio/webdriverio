import type { RuntimeMessage } from 'allure-js-commons/sdk'
import { MessageTestRuntime } from 'allure-js-commons/sdk/runtime'
import { events } from './constants.js'

export class WdioTestRuntime extends MessageTestRuntime {
    async sendMessage(message: RuntimeMessage) {
        process.emit(events.runtimeMessage as never, message as never)

        return Promise.resolve()
    }
}
