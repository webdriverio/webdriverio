import AiService from './service.js'
import AiLauncher from './launcher.js'
import { AiRuntime, type ActScope } from './runtime.js'
import type { ActOptions, ActResult } from './types.js'

export default AiService
export const launcher = AiLauncher
export { ActError } from './errors.js'
export { ACT_EVENT, type ActRecord } from './stats.js'
export { DEFAULT_ACTIONS } from './tools.js'
export type * from './types.js'

const standalone = new AiRuntime()

/**
 * `act` without the testrunner, e.g. in a `remote()` script:
 *
 * ```ts
 * await act(browser, 'Add a blue shirt to the cart', { model: 'anthropic:claude-sonnet-5-5' })
 * ```
 */
export function act (scope: ActScope, instruction: string, options?: ActOptions): Promise<ActResult> {
    return standalone.act(scope, instruction, options)
}

declare global {
    namespace WebdriverIO {
        interface Browser {
            /**
             * Perform a user action described in natural language, e.g.
             * `browser.act('Add a blue shirt in size M to the cart')`.
             */
            act: (instruction: string, options?: ActOptions) => Promise<ActResult>
        }
        interface Element {
            /**
             * Perform a user action within this element.
             */
            act: (instruction: string, options?: ActOptions) => Promise<ActResult>
        }
        interface BrowsingContext {
            /**
             * Perform a user action in this tab, window or frame.
             */
            act: (instruction: string, options?: ActOptions) => Promise<ActResult>
        }
    }
}
