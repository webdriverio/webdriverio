import type { RuntimeMessage } from 'allure-js-commons/sdk'
import { MessageTestRuntime } from 'allure-js-commons/sdk/runtime'

export const ALLURE_RUNTIME_MESSAGE_EVENT = 'allure_runtime_message'

export class WdioTestRuntime extends MessageTestRuntime {
    async sendMessage(message: RuntimeMessage) {
        process.emit(ALLURE_RUNTIME_MESSAGE_EVENT as any, message as any)

        return Promise.resolve()
    }
}
