import path from 'node:path'
import { format } from 'node:util'
import Mocha, { Runner } from 'mocha'

import logger from '@wdio/logger'
import { runTestInFiberContext, executeHooksWithArgs } from '@wdio/utils'
import { setOptions } from 'expect-webdriverio'
import type { Capabilities, Services } from '@wdio/types'

import { loadModule } from './utils.js'
import { INTERFACES, EVENTS, NOOP, MOCHA_TIMEOUT_MESSAGE, MOCHA_TIMEOUT_MESSAGE_REPLACEMENT } from './constants.js'
import type { MochaConfig, MochaOpts as MochaOptsImport, FrameworkMessage, FormattedMessage, MochaContext, MochaError } from './types'
import type { EventEmitter } from 'node:events'
import type ExpectWebdriverIO from 'expect-webdriverio'

const log = logger('@wdio/mocha-framework')

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

type EventTypes = 'hook' | 'test' | 'suite'
type EventTypeProps = '_hookCnt' | '_testCnt' | '_suiteCnt'

/**
 * Mocha runner
 */
class MochaAdapter {
    private _mocha?: Mocha
    private _runner?: Runner
    private _specLoadError?: Error

    private _level = 0
    private _hasTests = true
    private _suiteIds: string[] = ['0']
    private _suiteCnt: Map<string, number> = new Map()
    private _hookCnt: Map<string, number> = new Map()
    private _testCnt: Map<string, number> = new Map()
    private _suiteStartDate: number = Date.now()

    constructor(
        private _cid: string,
        private _config: MochaConfig,
        private _specs: string[],
        private _capabilities: Capabilities.RemoteCapability,
        private _reporter: EventEmitter
    ) {
        this._config = Object.assign({
            mochaOpts: {}
        }, _config)
    }

    async init() {
        const { mochaOpts } = this._config
        const mocha = this._mocha = new Mocha(mochaOpts)
        await mocha.loadFilesAsync()
        mocha.reporter(NOOP as any)
        mocha.fullTrace()

        this._specs.forEach((spec) => mocha.addFile(spec))
        mocha.suite.on('pre-require', this.preRequire.bind(this))
        await this._loadFiles(mochaOpts)

        setOptions({
            wait: this._config.waitforTimeout, // ms to wait for expectation to succeed
            interval: this._config.waitforInterval, // interval between attempts
        })

        return this
    }

    async _loadFiles (mochaOpts: MochaOptsImport) {
        try {
            await this._mocha!.loadFilesAsync()

            /**
             * grep
             */
            const mochaRunner = new Mocha.Runner(this._mocha!.suite, { delay: false })
            if (mochaOpts.grep) {
                mochaRunner.grep(this._mocha!.options.grep as RegExp, mochaOpts.invert!)
            }

            this._hasTests = mochaRunner.total > 0
        } catch (err: any) {
            const error = '' +
                'Unable to load spec files quite likely because they rely on `browser` object that is not fully initialised.\n' +
                '`browser` object has only `capabilities` and some flags like `isMobile`.\n' +
                'Helper files that use other `browser` commands have to be moved to `before` hook.\n' +
                `Spec file(s): ${this._specs.join(',')}\n` +
                `Error: ${err.stack}`
            this._specLoadError = new Error(error)
            log.warn(error)
        }
    }

    hasTests () {
        return this._hasTests
    }

    async run () {
        const mocha = this._mocha!

        let runtimeError
        const result = await new Promise((resolve) => {
            try {
                this._runner = mocha.run(resolve)
            } catch (err: any) {
                runtimeError = err
                return resolve(1)
            }

            Object.keys(EVENTS).forEach((e: keyof typeof EVENTS) =>
                this._runner!.on(e, this.emit.bind(this, EVENTS[e])))

            this._runner.suite.beforeAll(this.wrapHook('beforeSuite'))
            this._runner.suite.afterAll(this.wrapHook('afterSuite'))
        })
        await executeHooksWithArgs('after', this._config.after as Function, [runtimeError || result, this._capabilities, this._specs])

        /**
         * in case the spec has a runtime error throw after the wdio hook
         */
        if (runtimeError || this._specLoadError) {
            throw runtimeError || this._specLoadError
        }

        return result
    }

    options (
        options: MochaOptsImport,
        context: MochaContext
    ) {
        let { require = [], compilers = [] } = options

        if (typeof require === 'string') {
            require = [require]
        }

        return this.requireExternalModules([...compilers, ...require], context)
    }

    preRequire (
        context: Mocha.MochaGlobals,
        file: string,
        mocha: Mocha
    ) {
        const options = this._config.mochaOpts

        const match = MOCHA_UI_TYPE_EXTRACTOR.exec(options.ui!) as any as [string, keyof typeof INTERFACES]
        const type: keyof typeof INTERFACES = (match && INTERFACES[match[1]] && match[1]) || DEFAULT_INTERFACE_TYPE

        const hookArgsFn = (context: Mocha.Context) => {
            return [{ ...context.test, parent: context.test?.parent?.title }, context]
        }

        INTERFACES[type].forEach((fnName: string) => {
            let testCommand = INTERFACES[type][0]
            const isTest = [testCommand, testCommand + '.only'].includes(fnName)

            runTestInFiberContext(
                isTest,
                isTest ? this._config.beforeTest! : this._config.beforeHook!,
                // @ts-ignore
                hookArgsFn,
                isTest ? this._config.afterTest : this._config.afterHook,
                hookArgsFn,
                fnName,
                this._cid
            )
        })
        return this.options(options, { context, file, mocha, options })
    }

    /**
     * Hooks which are added as true Mocha hooks need to call done() to notify async
     */
    wrapHook (hookName: keyof Services.HookFunctions) {
        return () => executeHooksWithArgs(
            hookName,
            this._config[hookName] as Function,
            [this.prepareMessage(hookName)]
        ).catch((e) => {
            log.error(`Error in ${hookName} hook: ${e.stack.slice(7)}`)
        })
    }

    prepareMessage (hookName: keyof Services.HookFunctions) {
        const params: FrameworkMessage = { type: hookName }

        switch (hookName) {
        case 'beforeSuite':
            this._suiteStartDate = Date.now()
            params.payload = this._runner?.suite.suites[0]
            break
        case 'afterSuite':
            params.payload = this._runner?.suite.suites[0]
            params.payload.duration = params.payload.duration || (Date.now() - this._suiteStartDate)
            break
        case 'beforeTest':
        case 'afterTest':
            params.payload = this._runner?.test
            break
        }

        return this.formatMessage(params)
    }

    formatMessage (params: FrameworkMessage) {
        let message: FormattedMessage = {
            type: params.type
        }

        const mochaAllHooksIfPresent = params.payload?.title?.match(/^"(before|after)( all| each)?" hook/)

        if (params.err) {
            /**
             * replace "Ensure the done() callback is being called in this test." with a more meaningful message
             */
            if (params.err && params.err.message && params.err.message.includes(MOCHA_TIMEOUT_MESSAGE)) {
                const replacement = format(MOCHA_TIMEOUT_MESSAGE_REPLACEMENT, params.payload.parent.title, params.payload.title)
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

    requireExternalModules (modules: string[], context: MochaContext) {
        return modules.map((module) => {
            if (!module) {
                return Promise.resolve()
            }

            module = module.replace(/.*:/, '')

            if (module.substr(0, 1) === '.') {
                module = path.join(process.cwd(), module)
            }

            return loadModule(module, context)
        })
    }

    emit (event: string, payload: any, err?: MochaError) {
        /**
         * For some reason, Mocha fires a second 'suite:end' event for the root suite,
         * with no matching 'suite:start', so this can be ignored.
         */
        if (payload.root) return

        let message = this.formatMessage({ type: event, payload, err })

        message.cid = this._cid
        message.specs = this._specs
        message.uid = this.getUID(message)

        this._reporter.emit(message.type, message)
    }

    getSyncEventIdStart (type: EventTypes) {
        const prop = `_${type}Cnt` as EventTypeProps
        const suiteId = this._suiteIds[this._suiteIds.length - 1]
        const cnt = this[prop].has(suiteId)
            ? this[prop].get(suiteId) || 0
            : 0
        this[prop].set(suiteId, cnt + 1)
        return `${type}-${suiteId}-${cnt}`
    }

    getSyncEventIdEnd (type: EventTypes) {
        const prop = `_${type}Cnt` as EventTypeProps
        const suiteId = this._suiteIds[this._suiteIds.length - 1]
        const cnt = this[prop].get(suiteId)! - 1
        return `${type}-${suiteId}-${cnt}`
    }

    getUID (message: FrameworkMessage) {
        if (message.type === 'suite:start') {
            const suiteCnt = this._suiteCnt.has(this._level.toString())
                ? this._suiteCnt.get(this._level.toString())
                : 0
            const suiteId = `suite-${this._level}-${suiteCnt}`

            if (this._suiteCnt.has(this._level.toString())) {
                this._suiteCnt.set(this._level.toString(), this._suiteCnt.get(this._level.toString())! + 1)
            } else {
                this._suiteCnt.set(this._level.toString(), 1)
            }

            // const suiteId = this.getSyncEventIdStart('suite')
            this._suiteIds.push(`${this._level}${suiteCnt}`)
            this._level++
            return suiteId
        }
        if (message.type === 'suite:end') {
            this._level--
            const suiteCnt = this._suiteCnt.get(this._level.toString())! - 1
            const suiteId = `suite-${this._level}-${suiteCnt}`
            this._suiteIds.pop()
            return suiteId
        }
        if (message.type === 'hook:start') {
            return this.getSyncEventIdStart('hook')
        }
        if (message.type === 'hook:end') {
            return this.getSyncEventIdEnd('hook')
        }
        if (['test:start', 'test:pending'].includes(message.type)) {
            return this.getSyncEventIdStart('test')
        }
        if (['test:end', 'test:pass', 'test:fail', 'test:retry'].includes(message.type)) {
            return this.getSyncEventIdEnd('test')
        }

        throw new Error(`Unknown message type : ${message.type}`)
    }
}

const adapterFactory: { init?: Function } = {}

adapterFactory.init = async function (...args: any[]) {
    // @ts-ignore just passing through args
    const adapter = new MochaAdapter(...args)
    const instance = await adapter.init()
    return instance
}

export default adapterFactory
export { MochaAdapter, adapterFactory }

declare global {
    namespace WebdriverIO {
        interface MochaOpts extends MochaOptsImport {}
    }
    namespace NodeJS {
        interface Global {
            expect: ExpectWebdriverIO.Expect
        }
    }
}
