import { wrapGlobalTestMethod } from '@wdio/utils'

import { INTERFACES, TEST_INTERFACES, MOCHA_TIMEOUT_MESSAGE } from './constants.js'
import type { FormattedMessage, FrameworkMessage, MochaOpts } from './types.js'

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

export function formatMessage (params: FrameworkMessage) {
    const message: FormattedMessage = {
        type: params.type
    }
    const payload = params.payload as Payload | undefined

    const mochaAllHooksIfPresent = payload?.title?.match(/^"(before|after)( all| each)?" hook/)

    if (params.err) {
        /**
         * replace "Ensure the done() callback is being called in this test." with a more meaningful message
         */
        if (params.err && params.err.message && params.err.message.includes(MOCHA_TIMEOUT_MESSAGE)) {
            const testName = (payload?.parent?.title ? `${payload.parent.title} ${payload.title}` : payload?.title) || 'unknown test'
            const replacement = (
                `The execution in the test "${testName}" took too long. Try to reduce the run time or ` +
                'increase your timeout for test specs (https://webdriver.io/docs/timeouts).'
            )
            params.err.message = params.err.message.replace(MOCHA_TIMEOUT_MESSAGE, replacement)
            params.err.stack = params.err.stack.replace(MOCHA_TIMEOUT_MESSAGE, replacement)
        }

        message.error = {
            name: params.err.name,
            message: params.err.message,
            stack: params.err.stack,
            type: params.err.type || params.err.name,
            expected: params.err.expected,
            actual: params.err.actual
        }

        /**
         * hook failures are emitted as "test:fail"
         */
        if (mochaAllHooksIfPresent) {
            message.type = 'hook:end'
        }
    }

    if (payload) {
        message.title = payload.title
        message.parent = payload.parent ? payload.parent.title : undefined

        let fullTitle = message.title
        if (payload.parent) {
            let parent = payload.parent
            while (parent && parent.title) {
                fullTitle = parent.title + '.' + fullTitle
                parent = parent.parent as Payload
            }
        }

        message.fullTitle = fullTitle
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
 * require external modules
 * @param mods list of modules to load before the test starts
 * @param loader  function to import the module, optional and for testing purposes only
 */
export function requireExternalModules (mods: string[], loader = loadModule) {
    return mods.map((mod) => {
        if (!mod) {
            return Promise.resolve()
        }

        mod = mod.includes(':') ? mod.substring(mod.lastIndexOf(':') + 1) : mod

        if (mod.startsWith('./') && globalThis.process) {
            mod = `${globalThis.process.cwd()}/${mod.slice(2)}`
        }

        return loader(mod)
    })
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

    const { compilers = [] } = options
    return requireExternalModules([...compilers])
}

export async function loadModule (name: string) {
    try {
        return await import(/* @vite-ignore */name)
    } catch {
        throw new Error(`Module ${name} can't get loaded. Are you sure you have installed it?\n` +
                        'Note: if you\'ve installed WebdriverIO globally you need to install ' +
                        'these external modules globally too!')
    }
}
