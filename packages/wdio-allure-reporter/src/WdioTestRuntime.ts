import type { RuntimeMessage } from 'allure-js-commons/sdk'
import { MessageTestRuntime } from 'allure-js-commons/sdk/runtime'
import { events } from './constants.js'
import { getCid } from './utils.js'

export class WdioTestRuntime extends MessageTestRuntime {
    async sendMessage(message: RuntimeMessage) {
        process.emit(events.runtimeMessage as any, {
            cid: getCid(),
            message,
        } as any)

        return Promise.resolve()
    }
}
