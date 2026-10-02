import AiService from './service.js'
import AiLauncher from './launcher.js'
import { AiRuntime, type ActScope } from './runtime.js'
import type { StandardSchemaV1 } from '@standard-schema/spec'

import type { ActOptions, ActResult, ExtractOptions } from './types.js'

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

/**
 * `extract` without the testrunner:
 *
 * ```ts
 * const total = await extract(browser, 'the order total', z.number(), { model: 'anthropic:claude-sonnet-5-5' })
 * ```
 */
export function extract<T> (scope: ActScope, instruction: string, schema: StandardSchemaV1<unknown, T>, options?: ExtractOptions): Promise<T> {
    return standalone.extract(scope, instruction, schema, options)
}

declare global {
    namespace WebdriverIO {
        interface Browser {
            /**
             * Perform a user action described in natural language, e.g.
             * `browser.act('Add a blue shirt in size M to the cart')`.
             */
            act: (instruction: string, options?: ActOptions) => Promise<ActResult>
            /**
             * Read typed data from the page, e.g.
             * `browser.extract('the cart line items', z.array(z.object({ name: z.string(), qty: z.number() })))`.
             * The result is validated against the schema.
             */
            extract: <T>(instruction: string, schema: StandardSchemaV1<unknown, T>, options?: ExtractOptions) => Promise<T>
        }
        interface Element {
            /**
             * Perform a user action within this element.
             */
            act: (instruction: string, options?: ActOptions) => Promise<ActResult>
            /**
             * Read typed data from within this element.
             */
            extract: <T>(instruction: string, schema: StandardSchemaV1<unknown, T>, options?: ExtractOptions) => Promise<T>
        }
        interface BrowsingContext {
            /**
             * Perform a user action in this tab, window or frame.
             */
            act: (instruction: string, options?: ActOptions) => Promise<ActResult>
            /**
             * Read typed data from this tab, window or frame.
             */
            extract: <T>(instruction: string, schema: StandardSchemaV1<unknown, T>, options?: ExtractOptions) => Promise<T>
        }
    }
}
