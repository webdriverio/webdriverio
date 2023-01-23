import url from 'node:url'
import path from 'node:path'
import type { Runner } from 'mocha'
import Mocha from 'mocha'
// @ts-expect-error not exposed from package yet, see https://github.com/mochajs/mocha/issues/4961
import { handleRequires } from 'mocha/lib/cli/run-helpers.js'

import logger from '@wdio/logger'
import { executeHooksWithArgs } from '@wdio/utils'
import type { Capabilities, Services, Options } from '@wdio/types'

import { formatMessage, setupEnv } from './common.js'
import { EVENTS, NOOP } from './constants.js'
import type { MochaOpts as MochaOptsImport, FrameworkMessage, MochaError } from './types.js'
import type { EventEmitter } from 'node:events'

const log = logger('@wdio/mocha-framework')
const FILE_PROTOCOL = 'file://'

type EventTypes = 'hook' | 'test' | 'suite'
type EventTypeProps = '_hookCnt' | '_testCnt' | '_suiteCnt'
interface ParsedConfiguration extends Required<Options.Testrunner> {
    rootDir: string
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
    private _suiteIds: string[] = ['0']
    private _suiteCnt: Map<string, number> = new Map()
    private _hookCnt: Map<string, number> = new Map()
    private _testCnt: Map<string, number> = new Map()
    private _suiteStartDate: number = Date.now()

    constructor(
        private _cid: string,
        private _config: ParsedConfiguration,
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
        if (Array.isArray(mochaOpts.require)) {
            const plugins = await handleRequires(
                mochaOpts.require
                    .filter((p) => typeof p === 'string')
                    .map((p) => path.resolve(this._config.rootDir, p))
            )
            Object.assign(mochaOpts, plugins)
        }

        const mocha = this._mocha = new Mocha(mochaOpts)
        await mocha.loadFilesAsync()
        mocha.reporter(NOOP as any)
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
        await this._loadFiles(mochaOpts)
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
            if (params.payload) {
                params.payload.duration = params.payload.duration || (Date.now() - this._suiteStartDate)
            }
            break
        case 'beforeTest':
        case 'afterTest':
            params.payload = this._runner?.test
            break
        }

        return formatMessage(params)
    }

    emit (event: string, payload: any, err?: MochaError) {
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
export * from './types.js'

declare global {
    namespace WebdriverIO {
        interface MochaOpts extends MochaOptsImport {}
    }
}
