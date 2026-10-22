import url from 'node:url'
import path from 'node:path'
import type { Runner } from 'mocha'
import Mocha from 'mocha'
// Mocha 12 ships this helper as CJS and does not expose it from the package root yet
// @see https://github.com/mochajs/mocha/issues/4961
// @ts-expect-error not exposed from package yet
import { handleRequires } from 'mocha/lib/cli/run-helpers.cjs'

import logger from '@wdio/logger'
import { executeHooksWithArgs } from '@wdio/utils'
import type { Services } from '@wdio/types'

import { applyMochaDefaults, formatMessage, setupEnv } from './common.js'
import { EVENTS, NOOP } from './constants.js'
import type { MochaOpts as MochaOptsImport, FrameworkMessage, MochaError } from './types.js'
import type { ParallelMode } from './parallel.js'
import { runParallelTests } from './parallel.js'
import type { EventEmitter } from 'node:events'

const log = logger('@wdio/mocha-framework')
const FILE_PROTOCOL = 'file://'

type EventTypes = 'hook' | 'test' | 'suite'
type EventTypeProps = '_hookCnt' | '_testCnt' | '_suiteCnt'
interface ParsedConfiguration extends Required<WebdriverIO.Config> {
    rootDir: string
    mochaOpts: MochaOptsImport
}

/** The reporter fields of a root-suite hook in a sequential run (Mocha's setHookTitle) */
function rootHookMessage(kind: 'before all' | 'after all', tests: { title: string }[] = []) {
    const test = kind === 'before all' ? tests[0] : tests[tests.length - 1]
    const title = test ? `"${kind}" hook for "${test.title}"` : `"${kind}" hook in "{root}"`
    return { title, fullTitle: title, parent: '' }
}

/**
 * Mocha runner
 */
class MochaAdapter {
    private _mocha?: Mocha
    private _runner?: Runner
    private _specLoadError?: Error

    private _level = 0
    private _hasTests = true
    private _browser?: WebdriverIO.Browser
    private _suiteIds: string[] = ['0']
    private _suiteCnt: Map<string, number> = new Map()
    private _hookCnt: Map<string, number> = new Map()
    private _testCnt: Map<string, number> = new Map()
    /** uid of the test between its test:start and its test:end */
    private _openTestUid?: string
    private _suiteStartDate: number = Date.now()

    constructor(
        private _cid: string,
        private _config: ParsedConfiguration,
        private _specs: string[],
        private _capabilities: WebdriverIO.Capabilities,
        private _reporter: EventEmitter
    ) {
        this._config = Object.assign({
            mochaOpts: {}
        }, _config)
    }

    async init() {
        const { mochaOpts } = this._config
        if (Array.isArray(mochaOpts.require)) {
            const plugins = await handleRequires(
                mochaOpts.require
                    .filter((p) => typeof p === 'string')
                    .map((p) => path.resolve(this._config.rootDir, p))
            )
            Object.assign(mochaOpts, plugins)
        }

        applyMochaDefaults(mochaOpts)

        const mocha = this._mocha = new Mocha(mochaOpts)
        mocha.reporter(NOOP as unknown as Mocha.Reporter)
        mocha.fullTrace()

        /**
         * as Mocha doesn't support file:// formats yet we have to
         * remove it before adding it to Mocha
         */
        this._specs.forEach((spec) => mocha.addFile(
            spec.startsWith(FILE_PROTOCOL)
                ? url.fileURLToPath(spec)
                : spec
        ))

        const { beforeTest, beforeHook, afterTest, afterHook } = this._config
        mocha.suite.on('pre-require', () =>
            setupEnv(this._cid, this._config.mochaOpts, beforeTest, beforeHook, afterTest, afterHook))
        mocha.suite.on('require', () => mocha.unloadFiles())
        await this._loadFiles(mochaOpts)
        return this
    }

    async _loadFiles (mochaOpts: MochaOptsImport) {
        try {
            // @ts-ignore outdated types
            await this._mocha!.loadFilesAsync({
                esmDecorator: (file: string) => `${file}?invalidateCache=${Math.random()}`
            })

            /**
             * grep
             */
            const mochaRunner = new Mocha.Runner(this._mocha!.suite, { delay: false })
            if (mochaOpts.grep) {
                mochaRunner.grep(this._mocha!.options.grep as RegExp, mochaOpts.invert!)
            }

            this._hasTests = mochaRunner.total > 0
        } catch (err) {
            const error = '' +
                'Unable to load spec files quite likely because they rely on `browser` object that is not fully initialized.\n' +
                '`browser` object has only `capabilities` and some flags like `isMobile`.\n' +
                'Helper files that use other `browser` commands have to be moved to `before` hook.\n' +
                `Spec file(s): ${this._specs.join(',')}\n` +
                `Error: ${(err as Error).stack}`
            this._specLoadError = new Error(error)
            log.warn(error)
        }
    }

    setBrowser (browser: WebdriverIO.Browser) {
        this._browser = browser
    }

    hasTests () {
        return this._hasTests
    }

    async run () {
        const mocha = this._mocha!

        const parallelMode = this._config.mochaOpts?.parallelMode
        if (parallelMode === 'contexts' || parallelMode === 'userContexts') {
            return this._runParallelMode(mocha, parallelMode)
        }

        return this._runSequential(mocha)
    }

    private async _runParallelMode(mocha: Mocha, mode: ParallelMode) {
        const browser = (this._browser ?? (globalThis as Record<string, unknown>).browser) as WebdriverIO.Browser & { isBidi: boolean; __bidiCommandsEnabled?: boolean }
        if (!browser) {
            throw new Error(
                'Parallel mode requires a browser instance. ' +
                'Ensure WebDriver session is initialized before tests run.'
            )
        }

        if (!browser.isBidi) {
            log.warn(
                `parallelMode: "${mode}" is set but the browser session does not support ` +
                'WebDriver Bidi. This may be because "wdio:enforceWebDriverClassic" is enabled ' +
                'or the browser does not support Bidi. Falling back to sequential execution.'
            )
            return this._runSequential(mocha)
        }

        if (browser.__bidiCommandsEnabled !== true) {
            log.warn(
                `parallelMode: "${mode}" requires 'wdio:experimentalBiDiCommands': true ` +
                'to be set in capabilities. Without it, element commands use classic protocol ' +
                'which cannot target Bidi-created browsing contexts. ' +
                'Falling back to sequential execution.'
            )
            return this._runSequential(mocha)
        }

        if (this._config.mochaOpts.bail) {
            throw new Error(`bail is not supported in parallel mode (parallelMode: "${mode}")`)
        }
        if (this._config.mochaOpts.retries) {
            throw new Error(`retries is not supported in parallel mode (parallelMode: "${mode}")`)
        }

        // mocha.run() applies .only() via rootSuite.filterOnly(); the parallel
        // path never calls mocha.run(), so filter before collecting tests.
        const mochaSuite = mocha.suite as unknown as { hasOnly?: () => boolean; filterOnly?: () => void }
        if (mochaSuite.hasOnly?.()) {
            mochaSuite.filterOnly?.()
        }

        // Config hooks are surfaced as paired hook:start/hook:end events like
        // sequential mode's root-suite hooks (wrapHook): prepareMessage payloads
        // with Mocha's root hook title. They run against the session-global context (no tab).
        const rootTests = (mocha.suite as unknown as { tests?: { title: string }[] }).tests
        const beforeSuiteMsg = this.prepareMessage('beforeSuite')
        const beforeSuiteHook = { ...beforeSuiteMsg, ...rootHookMessage('before all', rootTests) }
        const beforeSuiteUid = this.getSyncEventIdStart('hook')
        this._reporter.emit('hook:start', { ...beforeSuiteHook, type: 'hook:start', cid: this._cid, specs: this._specs, uid: beforeSuiteUid })
        try {
            await executeHooksWithArgs('beforeSuite', this._config.beforeSuite as Function, [beforeSuiteMsg])
            this._reporter.emit('hook:end', { ...beforeSuiteHook, type: 'hook:end', state: 'pass', duration: Date.now() - this._suiteStartDate, cid: this._cid, specs: this._specs, uid: beforeSuiteUid })
        } catch (err) {
            log.error(`Error in beforeSuite hook: ${(err as Error).stack?.slice(7) || (err as Error).message}`)
            this._reporter.emit('hook:end', { ...beforeSuiteHook, type: 'hook:end', state: 'fail', duration: Date.now() - this._suiteStartDate, error: { name: (err as Error).name || 'Error', message: (err as Error).message, stack: (err as Error).stack }, cid: this._cid, specs: this._specs, uid: beforeSuiteUid })
        }

        let failures: number
        let runtimeError: Error | undefined
        try {
            failures = await runParallelTests(
                mocha.suite, browser, this._reporter, this._cid, this._specs,
                this._config.mochaOpts.maxParallelContexts,
                {
                    // the Mocha constructor already compiled grep/fgrep into
                    // options.grep (fgrep wins when both are set)
                    grep: mocha.options?.grep as RegExp | undefined,
                    invert: mocha.options?.invert,
                    timeout: this._config.mochaOpts.timeout,
                    mode,
                    failHookAffectedTests: this._config.mochaOpts.failHookAffectedTests
                }
            )
        } catch (err) {
            runtimeError = err as Error
            failures = 1
        }

        const afterSuiteMsg = this.prepareMessage('afterSuite')
        const afterSuiteHook = { ...afterSuiteMsg, ...rootHookMessage('after all', rootTests) }
        const afterSuiteStartUid = this.getSyncEventIdStart('hook')
        this._reporter.emit('hook:start', { ...afterSuiteHook, type: 'hook:start', cid: this._cid, specs: this._specs, uid: afterSuiteStartUid })
        try {
            await executeHooksWithArgs('afterSuite', this._config.afterSuite as Function, [afterSuiteMsg])
            this._reporter.emit('hook:end', { ...afterSuiteHook, type: 'hook:end', state: 'pass', duration: Date.now() - this._suiteStartDate, cid: this._cid, specs: this._specs, uid: this.getSyncEventIdEnd('hook') })
        } catch (err) {
            log.error(`Error in afterSuite hook: ${(err as Error).stack?.slice(7) || (err as Error).message}`)
            this._reporter.emit('hook:end', { ...afterSuiteHook, type: 'hook:end', state: 'fail', duration: Date.now() - this._suiteStartDate, error: { name: (err as Error).name || 'Error', message: (err as Error).message, stack: (err as Error).stack }, cid: this._cid, specs: this._specs, uid: this.getSyncEventIdEnd('hook') })
        }

        return this._finalize(failures, runtimeError)
    }

    private async _runSequential(mocha: Mocha) {
        let runtimeError: Error | undefined
        const result = await new Promise<number>((resolve) => {
            try {
                this._runner = mocha.run(resolve as (failures: number) => void)
            } catch (err) {
                runtimeError = err as Error
                return resolve(1)
            }

            Object.keys(EVENTS).forEach((e: keyof typeof EVENTS) =>
                this._runner!.on(e, this.emit.bind(this, EVENTS[e])))

            this._runner.suite.beforeAll(this.wrapHook('beforeSuite'))
            this._runner.suite.afterAll(this.wrapHook('afterSuite'))
        })
        return this._finalize(result, runtimeError)
    }

    /**
     * Shared teardown: emit 'after' hook, then conditionally throw stored errors.
     */
    private async _finalize(result: number, error?: Error) {
        await executeHooksWithArgs('after', this._config.after as Function, [
            error || this._specLoadError || result, this._capabilities, this._specs
        ])
        if (error || this._specLoadError) {
            throw error || this._specLoadError
        }
        return result
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
            // _runner is only set in sequential mode; parallel mode has mocha
            params.payload = this._runner?.suite.suites[0] || this._mocha?.suite?.suites?.[0]
            break
        case 'afterSuite':
            params.payload = this._runner?.suite.suites[0] || this._mocha?.suite?.suites?.[0]
            if (params.payload) {
                (params.payload as { duration: number }).duration = (
                    (params.payload as { duration: number }).duration ||
                    (Date.now() - this._suiteStartDate)
                )
            }
            break
        case 'beforeTest':
        case 'afterTest':
            params.payload = this._runner?.test
            break
        }

        return formatMessage(params)
    }

    emit (event: string, payload: Record<string, unknown>, err?: MochaError) {
        /**
         * For some reason, Mocha fires a second 'suite:end' event for the root suite,
         * with no matching 'suite:start', so this can be ignored.
         */
        if (payload.root) {
            return
        }

        const message = formatMessage({ type: event, payload, err })

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
        if (message.type === 'test:start') {
            this._openTestUid = this.getSyncEventIdStart('test')
            return this._openTestUid
        }
        if (message.type === 'test:pending') {
            // this.skip() at runtime ends the test that started; it.skip has no test:start
            return this._openTestUid ?? this.getSyncEventIdStart('test')
        }
        if (['test:end', 'test:pass', 'test:fail', 'test:retry'].includes(message.type)) {
            if (message.type === 'test:end') {
                this._openTestUid = undefined
            }
            return this.getSyncEventIdEnd('test')
        }

        throw new Error(`Unknown message type : ${message.type}`)
    }
}

const adapterFactory: { init?: Function } = {}

adapterFactory.init = async function (...args: unknown[]) {
    // @ts-ignore just passing through args
    const adapter = new MochaAdapter(...args)
    const instance = await adapter.init()
    return instance
}

export default adapterFactory
export { MochaAdapter, adapterFactory }
export * from './types.js'

declare global {
    namespace WebdriverIO {
        interface MochaOpts extends MochaOptsImport {}
    }
}
