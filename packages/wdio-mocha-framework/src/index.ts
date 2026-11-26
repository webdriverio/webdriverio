import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import type { Runner } from 'mocha'
import Mocha from 'mocha'
// Mocha 12 ships this helper as CJS and does not expose it from the package root yet
// @see https://github.com/mochajs/mocha/issues/4961
// @ts-expect-error not exposed from package yet
import { handleRequires } from 'mocha/lib/cli/run-helpers.cjs'

import logger from '@wdio/logger'
import { executeHooksWithArgs, specFilePath, type ParallelMode } from '@wdio/utils'
import type { Services } from '@wdio/types'

import { applyMochaDefaults, formatMessage, rootSuiteTitle, setupEnv } from './common.js'
import { EVENTS, NOOP } from './constants.js'
import type { MochaOpts as MochaOptsImport, FrameworkMessage, FormattedMessage, MochaError } from './types.js'
import { runParallelTests } from './parallel.js'
import type { EventEmitter } from 'node:events'

const log = logger('@wdio/mocha-framework')
const BUILTIN_INTERFACES = new Set(['bdd', 'tdd', 'qunit', 'exports'])

type EventTypes = 'hook' | 'test' | 'suite'
type EventTypeProps = '_hookCnt' | '_testCnt' | '_suiteCnt'
interface ParsedConfiguration extends Required<WebdriverIO.Config> {
    rootDir: string
    mochaOpts: MochaOptsImport
}

/** a hook of the config or of a service to run (the runner adds the service hooks before the framework starts) */
function hasHooks(hooks: unknown) {
    return [hooks].flat().some((hook) => typeof hook === 'function')
}

/** The reporter fields of the root-suite hook of the config hooks in a sequential run (Mocha's setHookTitle) */
function rootHookMessage(kind: 'before all' | 'after all', tests: { title: string }[] = []) {
    const test = kind === 'before all' ? tests[0] : tests[tests.length - 1]
    const hook = `"${kind}" hook: ${kind === 'before all' ? 'beforeSuite' : 'afterSuite'}`
    const title = test ? `${hook} for "${test.title}"` : `${hook} in "{root}"`
    return { title, fullTitle: title, parent: '', hookKind: kind === 'before all' ? 'beforeAll' as const : 'afterAll' as const }
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
    /** Mocha test and its uid between its test:start and its test:end */
    private _openTest?: { payload: Record<string, unknown>, uid: string }
    /** Mocha suite → the uid of its suite:start */
    private _suiteUids = new WeakMap<object, string>()
    /** Synthetic wrapper suite emitted around root-level tests (e.g. QUnit without suite()) */
    private _rootTestSuite?: { uid: string, title: string, file?: string }
    /** Last synthetic wrapper suite opened in this run, used to anchor trailing root afterAll hooks */
    private _lastRootTestSuite?: { uid: string, title: string, file?: string }
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
                    .map((p) => this._resolveModule(p))
            )
            Object.assign(mochaOpts, plugins)
        }

        applyMochaDefaults(mochaOpts)

        const resolvedUi = await this._resolveUi(mochaOpts.ui)
        const mochaOptions = resolvedUi === mochaOpts.ui
            ? mochaOpts
            : { ...mochaOpts, ui: resolvedUi }
        const mocha = this._mocha = new Mocha(mochaOptions as Mocha.MochaOptions)
        mocha.reporter(NOOP as unknown as Mocha.Reporter)
        mocha.fullTrace()

        /**
         * as Mocha doesn't support file:// formats yet we have to
         * remove it before adding it to Mocha
         */
        this._specs.forEach((spec) => mocha.addFile(specFilePath(spec)))

        const { beforeTest, beforeHook, afterTest, afterHook } = this._config
        mocha.suite.on('pre-require', (context) =>
            setupEnv(this._cid, this._config.mochaOpts, beforeTest, beforeHook, afterTest, afterHook, context))
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
        // the suite duration of afterSuite, also with no beforeSuite hook (which sets it again)
        this._suiteStartDate = Date.now()

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

        const rootTests = (mocha.suite as unknown as { tests?: { title: string }[] }).tests
        await this._runRootHook('beforeSuite', rootTests)

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
                    failHookAffectedTests: this._config.mochaOpts.failHookAffectedTests,
                    allowUncaught: this._config.mochaOpts.allowUncaught,
                    ...(this._config.rootDir ? { rootDir: this._config.rootDir } : {})
                }
            )
        } catch (err) {
            runtimeError = err as Error
            failures = 1
        }

        await this._runRootHook('afterSuite', rootTests)

        return this._finalize(failures, runtimeError)
    }

    /**
     * Parallel mode: the config hooks surface as paired hook:start/hook:end events like sequential mode's
     * root-suite hooks (wrapHook): prepareMessage payloads with Mocha's root hook title. They run against
     * the session-global context (no tab)
     */
    private async _runRootHook(hookName: 'beforeSuite' | 'afterSuite', rootTests?: { title: string }[]) {
        if (!hasHooks(this._config[hookName])) {
            return
        }
        const message = this.prepareMessage(hookName)
        const hook = { ...message, ...rootHookMessage(hookName === 'beforeSuite' ? 'before all' : 'after all', rootTests) }
        const fields = { cid: this._cid, specs: this._specs, uid: this.getSyncEventIdStart('hook') }
        const start = Date.now()
        this._reporter.emit('hook:start', { ...hook, type: 'hook:start', ...fields })
        try {
            await executeHooksWithArgs(hookName, this._config[hookName] as Function, [message])
            this._reporter.emit('hook:end', { ...hook, type: 'hook:end', state: 'pass', duration: Date.now() - start, ...fields })
        } catch (err) {
            log.error(`Error in ${hookName} hook: ${(err as Error).stack?.slice(7) || (err as Error).message}`)
            this._reporter.emit('hook:end', { ...hook, type: 'hook:end', state: 'fail', duration: Date.now() - start, error: { name: (err as Error).name || 'Error', message: (err as Error).message, stack: (err as Error).stack }, ...fields })
        }
    }

    private _resolveModule (specifier: string) {
        const rootDir = this._config.rootDir || process.cwd()
        const candidatePath = path.resolve(rootDir, specifier)
        if (path.isAbsolute(specifier) || specifier.startsWith('.') || fs.existsSync(candidatePath)) {
            return candidatePath
        }

        try {
            const req = createRequire(path.join(rootDir, 'package.json'))
            return req.resolve(specifier)
        } catch {
            return specifier
        }
    }

    private async _resolveUi (ui: MochaOptsImport['ui']) {
        if (typeof ui !== 'string' || !ui || BUILTIN_INTERFACES.has(ui)) {
            return ui
        }

        const interfaces = (Mocha as unknown as { interfaces?: Record<string, unknown> }).interfaces
        if (interfaces && Object.hasOwn(interfaces, ui)) {
            return ui
        }

        const resolved = this._resolveModule(ui)
        if (!path.isAbsolute(resolved) || !fs.existsSync(resolved)) {
            return resolved
        }

        try {
            const loaded = await import(pathToFileURL(resolved).href)
            if (typeof loaded.default === 'function') {
                return loaded.default as (suite: Mocha.Suite) => void
            }
            if (typeof loaded === 'function') {
                return loaded as (suite: Mocha.Suite) => void
            }
            if (interfaces && Object.hasOwn(interfaces, ui)) {
                return ui
            }
        } catch {
            // Fall back to Mocha's own require() loader and error reporting.
        }

        return resolved
    }

    private _rootSuiteTitle (file?: string) {
        return rootSuiteTitle(file, this._config.rootDir)
    }

    private _firstMatchedRootTest (parent: unknown) {
        const tests = (parent as { tests?: { file?: string, fullTitle?: () => string, title?: string }[] } | undefined)?.tests
        if (!tests?.length) {
            return undefined
        }
        const grep = this._mocha?.options?.grep as RegExp | undefined
        if (!grep) {
            return tests[0]
        }
        const invert = Boolean(this._mocha?.options?.invert)
        return tests.find((test) => {
            const fullTitle = typeof test.fullTitle === 'function' ? test.fullTitle() : (test.title ?? '')
            return grep.test(fullTitle) !== invert
        })
    }

    private _openRootTestSuite (file?: string) {
        const normalizedFile = file
            ? specFilePath(file)
            : (this._specs[0] ? specFilePath(this._specs[0]) : undefined)
        if (this._rootTestSuite) {
            if (this._rootTestSuite.file === normalizedFile) {
                return this._rootTestSuite
            }
            this._closeRootTestSuite()
        }

        const title = this._rootSuiteTitle(normalizedFile)
        const uid = this.getUID({ type: 'suite:start' })
        const suite = { uid, title, file: normalizedFile }
        const message: FormattedMessage = {
            type: 'suite:start',
            title,
            fullTitle: title,
            parent: '',
            pending: false,
            file: normalizedFile,
            cid: this._cid,
            specs: this._specs,
            uid
        }
        this._rootTestSuite = suite
        this._lastRootTestSuite = suite
        this._reporter.emit('suite:start', message)
        return suite
    }

    private _closeRootTestSuite () {
        if (!this._rootTestSuite) {
            return
        }
        const { title, file } = this._rootTestSuite
        this._rootTestSuite = undefined
        const message: FormattedMessage = {
            type: 'suite:end',
            title,
            fullTitle: title,
            parent: '',
            pending: false,
            file,
            cid: this._cid,
            specs: this._specs,
            uid: this.getUID({ type: 'suite:end' })
        }
        this._reporter.emit('suite:end', message)
    }

    private async _runSequential(mocha: Mocha) {
        let runtimeError: Error | undefined
        const result = await new Promise<number>((resolve) => {
            try {
                this._runner = mocha.run((failures: number) => {
                    this._closeRootTestSuite()
                    resolve(failures)
                })
            } catch (err) {
                runtimeError = err as Error
                return resolve(1)
            }

            Object.keys(EVENTS).forEach((e: keyof typeof EVENTS) =>
                this._runner!.on(e, this.emit.bind(this, EVENTS[e])))

            // only with hooks to run; a title of their own: a user root hook has the title `"before all" hook in "{root}"`
            if (hasHooks(this._config.beforeSuite)) {
                this._runner.suite.beforeAll('beforeSuite', this.wrapHook('beforeSuite'))
            }
            if (hasHooks(this._config.afterSuite)) {
                this._runner.suite.afterAll('afterSuite', this.wrapHook('afterSuite'))
            }
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
         * Close any synthetic wrapper suite opened for root-level tests first.
         */
        if (payload.root) {
            if (event === 'suite:end') {
                this._closeRootTestSuite()
            }
            return
        }

        /**
         * Close any open wrapper suite before a real suite starts so reporters
         * do not nest top-level suites inside the synthetic wrapper.
         */
        if (event === 'suite:start') {
            this._closeRootTestSuite()
        }

        /**
         * Mocha 11.8+ sends a second 'test' event for the open test when a `beforeEach`
         * hook fails with `failHookAffectedTests` (mochajs/mocha#6442), so ignore it.
         * TODO: remove when the `mocha` version range of this package includes the fix of
         * https://github.com/mochajs/mocha/issues/6442
         */
        const isOpenTest = payload === this._openTest?.payload
        if (event === 'test:start' && isOpenTest) {
            return
        }

        const message = formatMessage({ type: event, payload, err })
        const isRootParent = Boolean((payload.parent as { root?: boolean } | undefined)?.root)
        let hookRootSuite: { uid: string, title: string, file?: string } | undefined
        const rootSuite = isRootParent && message.type.startsWith('test:')
            ? this._openRootTestSuite(payload.file as string | undefined)
            : undefined
        if (rootSuite) {
            message.parent = rootSuite.title
            if (message.title) {
                message.fullTitle = `${rootSuite.title}.${message.title}`
            }
        } else if (isRootParent && message.type.startsWith('hook:')) {
            if (message.hookKind === 'beforeAll' && !this._rootTestSuite && this._level === 0) {
                const firstRootTest = this._firstMatchedRootTest(payload.parent)
                if (firstRootTest) {
                    this._openRootTestSuite(firstRootTest.file ?? (payload.file as string | undefined))
                }
            }
            if (this._rootTestSuite) {
                hookRootSuite = this._rootTestSuite
                message.parent = this._rootTestSuite.title
            } else if (message.hookKind === 'afterAll' && this._lastRootTestSuite) {
                hookRootSuite = this._lastRootTestSuite
                message.parent = this._lastRootTestSuite.title
                message.parentUid = this._lastRootTestSuite.uid
            }
        }

        message.cid = this._cid
        message.specs = this._specs
        // this.skip() at runtime ends the test that started; it.skip has no test:start
        message.uid = event === 'test:pending' && isOpenTest ? this._openTest!.uid : this.getUID(message)
        if (event === 'test:start') {
            this._openTest = { payload, uid: message.uid }
        } else if (event === 'test:end') {
            this._openTest = undefined
        }
        if (event === 'suite:start') {
            this._suiteUids.set(payload, message.uid)
        }
        // the root suite has no suite:start unless a wrapper suite is associated with root-level tests
        const hookSuiteUid = (message.hookKind === 'beforeAll' || message.hookKind === 'afterAll')
            && (this._suiteUids.get(payload.parent as object) ?? hookRootSuite?.uid)
        if (hookSuiteUid) {
            message.hookSuiteUid = hookSuiteUid
        }

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
        if (message.type === 'test:start' || message.type === 'test:pending') {
            return this.getSyncEventIdStart('test')
        }
        if (['test:end', 'test:pass', 'test:fail', 'test:retry'].includes(message.type)) {
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
