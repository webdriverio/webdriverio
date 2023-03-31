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

export function formatMessage (params: FrameworkMessage) {
    const message: FormattedMessage = {
        type: params.type
    }

    const mochaAllHooksIfPresent = params.payload?.title?.match(/^"(before|after)( all| each)?" hook/)

    if (params.err) {
        /**
         * replace "Ensure the done() callback is being called in this test." with a more meaningful message
         */
        if (params.err && params.err.message && params.err.message.includes(MOCHA_TIMEOUT_MESSAGE)) {
            const replacement = (
                `The execution in the test "${params.payload.parent.title} ${params.payload.title}" took too long. Try to reduce the run time or ` +
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

    if (params.payload) {
        message.title = params.payload.title
        message.parent = params.payload.parent ? params.payload.parent.title : null

        let fullTitle = message.title
        if (params.payload.parent) {
            let parent = params.payload.parent
            while (parent && parent.title) {
                fullTitle = parent.title + '.' + fullTitle
                parent = parent.parent
            }
        }

        message.fullTitle = fullTitle
        message.pending = params.payload.pending || false
        message.file = params.payload.file
        message.duration = params.payload.duration

        /**
         * Add the current test title to the payload for cases where it helps to
         * identify the test, e.g. when running inside a beforeEach hook
         */
        if (params.payload.ctx && params.payload.ctx.currentTest) {
            message.currentTest = params.payload.ctx.currentTest.title
        }

        if (params.type.match(/Test/)) {
            message.passed = (params.payload.state === 'passed')
        }

        if (params.payload.parent?.title && mochaAllHooksIfPresent) {
            const hookName = mochaAllHooksIfPresent[0]
            message.title = `${hookName} for ${params.payload.parent.title}`
        }

        if (params.payload.context) { message.context = params.payload.context }
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

        mod = mod.replace(/.*:/, '')

        if (mod.startsWith('./') && globalThis.process) {
            mod = `${globalThis.process.cwd()}/${mod.slice(2)}`
        }

        return loader(mod)
    })
}

type Hook = Function | Function[]
export function setupEnv (cid: string, options: MochaOpts, beforeTest: Hook, beforeHook: Hook, afterTest: Hook, afterHook: Hook) {
    const match = MOCHA_UI_TYPE_EXTRACTOR.exec(options.ui!) as any as [string, keyof typeof INTERFACES]
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
        return await import(name)
    } catch (err: any) {
        throw new Error(`Module ${name} can't get loaded. Are you sure you have installed it?\n` +
                        'Note: if you\'ve installed WebdriverIO globally you need to install ' +
                        'these external modules globally too!')
    }
}
