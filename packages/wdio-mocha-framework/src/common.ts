import { wrapGlobalTestMethod } from '@wdio/utils'

import { INTERFACES, TEST_INTERFACES, MOCHA_TIMEOUT_MESSAGE } from './constants.js'
import type { FormattedMessage, FrameworkMessage, MochaError, MochaOpts } from './types.js'

/**
* Extracts the mocha UI type following this convention:
*  - If the mochaOpts.ui provided doesn't contain a '-' then the full name
*      is taken as ui type (i.e. 'bdd','tdd','qunit')
*  - If it contains a '-' then it asumes we are providing a custom ui for
*      mocha. Then it extracts the text after the last '-' (ignoring .js if
*      provided) as the interface type. (i.e. strong-bdd in
*      https://github.com/strongloop/strong-mocha-interfaces)
*/
const MOCHA_UI_TYPE_EXTRACTOR = /^(?:.*-)?([^-.]+)(?:.js)?$/
const DEFAULT_INTERFACE_TYPE = 'bdd'

interface Payload {
    title: string
    parent?: Payload | null
    file?: string
    duration?: number
    body?: string
    context?: unknown
    state?: string
    pending?: boolean
    ctx?: Mocha.Context
}

export interface TitledNode {
    title?: string
    parent?: TitledNode | null
}

export function dottedFullTitle(title: string, parent?: TitledNode | null) {
    let fullTitle = title
    while (parent && parent.title) {
        fullTitle = parent.title + '.' + fullTitle
        parent = parent.parent
    }
    return fullTitle
}

/**
 * The error of a reporter message, also used by parallel mode
 */
export function formatError (err: MochaError, testName: string): MochaError {
    /**
     * replace "Ensure the done() callback is being called in this test." with a more meaningful message
     */
    if (err.message && err.message.includes(MOCHA_TIMEOUT_MESSAGE)) {
        const replacement = (
            `The execution in the test "${testName}" took too long. Try to reduce the run time or ` +
            'increase your timeout for test specs (https://webdriver.io/docs/timeouts).'
        )
        err.message = err.message.replace(MOCHA_TIMEOUT_MESSAGE, replacement)
        err.stack = err.stack?.replace(MOCHA_TIMEOUT_MESSAGE, replacement)
    }

    return {
        name: err.name,
        message: err.message,
        stack: err.stack,
        type: err.type || err.name,
        expected: err.expected,
        actual: err.actual
    }
}

export function formatMessage (params: FrameworkMessage) {
    const message: FormattedMessage = {
        type: params.type
    }
    const payload = params.payload as Payload | undefined

    const mochaAllHooksIfPresent = payload?.title?.match(/^"(before|after)( all| each)?" hook/)

    if (params.err) {
        /**
         * Detect if this is a skip error from this.skip() in a hook.
         * When this.skip() is called in Mocha, it throws an error with message
         * "(sync|async) skip; aborting execution". We should NOT treat this as
         * a failure, but as a skip/pending state.
         * @see https://github.com/webdriverio/webdriverio/issues/14649
         */
        const isSkipError = /^(sync|async) skip; aborting execution$/.test(params.err.message || '')
        const isHookSkip = isSkipError && mochaAllHooksIfPresent

        if (isHookSkip) {
            /**
             * For skip errors in hooks, don't set error - set pending instead.
             * This ensures reporters don't mark the hook as failed.
             */
            message.type = 'hook:end'
        } else {
            const testName = (payload?.parent?.title ? `${payload.parent.title} ${payload.title}` : payload?.title) || 'unknown test'
            message.error = formatError(params.err, testName)

            /**
             * hook failures are emitted as "test:fail"
             */
            if (mochaAllHooksIfPresent) {
                message.type = 'hook:end'
            }
        }
    }

    if (payload) {
        message.title = payload.title
        message.parent = payload.parent ? payload.parent.title : undefined

        message.fullTitle = dottedFullTitle(message.title, payload.parent)
        message.pending = payload.pending || false
        message.file = payload.file
        message.duration = payload.duration
        message.body = payload.body

        /**
         * Add the current test title to the payload for cases where it helps to
         * identify the test, e.g. when running inside a beforeEach hook
         */
        if (payload.ctx && payload.ctx.currentTest) {
            message.currentTest = payload.ctx.currentTest.title
        }

        if (params.type.match(/Test/)) {
            message.passed = (payload.state === 'passed')
        }

        if (payload.parent?.title && mochaAllHooksIfPresent) {
            const hookName = mochaAllHooksIfPresent[0]
            message.title = `${hookName} for ${payload.parent.title}`
        }

        if (payload.context) { message.context = payload.context }
    }

    return message
}

/**
 * Mocha skips tests after a failing `before` or `beforeEach` and reports only
 * the hook. Fail those tests unless the user turned the option off.
 */
export function applyMochaDefaults (mochaOpts: MochaOpts) {
    if (mochaOpts.failHookAffectedTests === undefined) {
        mochaOpts.failHookAffectedTests = true
    }
    return mochaOpts
}

type Hook = Function | Function[]
export function setupEnv (cid: string, options: MochaOpts, beforeTest: Hook, beforeHook: Hook, afterTest: Hook, afterHook: Hook) {
    const match = MOCHA_UI_TYPE_EXTRACTOR.exec(options.ui!) as unknown as [string, keyof typeof INTERFACES]
    const type: keyof typeof INTERFACES = (match && INTERFACES[match[1]] && match[1]) || DEFAULT_INTERFACE_TYPE

    const hookArgsFn = (context: Mocha.Context) => {
        return [{ ...context.test, parent: context.test?.parent?.title }, context]
    }

    INTERFACES[type].forEach((fnName: string) => {
        const isTest = TEST_INTERFACES[type].flatMap((testCommand: string) => [testCommand, testCommand + '.only']).includes(fnName)

        wrapGlobalTestMethod(
            isTest,
            isTest ? beforeTest! : beforeHook!,
            // @ts-ignore
            hookArgsFn,
            isTest ? afterTest : afterHook,
            hookArgsFn,
            fnName,
            cid
        )
    })
}
