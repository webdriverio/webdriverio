import url from 'node:url'
import type { EventEmitter } from 'node:events'

import logger from '@wdio/logger'
import { executeHooksWithArgs } from '@wdio/utils'
import type { Services } from '@wdio/types'
import {
    startTests,
    describe as vitestDescribe,
    it as vitestIt,
    test as vitestTest,
    suite as vitestSuite,
    beforeAll as vitestBeforeAll,
    afterAll as vitestAfterAll,
    beforeEach as vitestBeforeEach,
    afterEach as vitestAfterEach,
} from '@vitest/runner'
import type { VitestRunnerConfig } from '@vitest/runner'

import { WDIOVitestRunner } from './runner.js'
import type { VitestOpts, FrameworkMessage } from './types.js'

const log = logger('@wdio/vitest-framework')
const FILE_PROTOCOL = 'file://'

interface ParsedConfiguration {
    rootDir: string
    vitestOpts: VitestOpts
    beforeSuite?: Function | Function[]
    afterSuite?: Function | Function[]
    beforeTest?: Function | Function[]
    afterTest?: Function | Function[]
    beforeHook?: Function | Function[]
    afterHook?: Function | Function[]
    before?: Function | Function[]
    after?: Function | Function[]
    [key: string]: unknown
}

/**
 * Vitest framework adapter for WebdriverIO.
 *
 * Uses @vitest/runner to execute tests while integrating with WebdriverIO's
 * hook system, service lifecycle, and reporter events.
 */
class VitestAdapter {
    private _runner?: WDIOVitestRunner
    private _hasTests = true
    private _specLoadError?: Error
    private _suiteStartDate: number = Date.now()

    constructor(
        private _cid: string,
        private _config: ParsedConfiguration,
        private _specs: string[],
        private _capabilities: WebdriverIO.Capabilities,
        private _reporter: EventEmitter
    ) {
        this._config = Object.assign({
            vitestOpts: {}
        }, _config)
    }

    async init() {
        const { vitestOpts } = this._config
        const runnerConfig = this._buildRunnerConfig(vitestOpts)

        this._runner = new WDIOVitestRunner(
            runnerConfig,
            this._cid,
            this._specs,
            this._reporter,
            {
                beforeTest: this._config.beforeTest,
                afterTest: this._config.afterTest,
                beforeHook: this._config.beforeHook,
                afterHook: this._config.afterHook,
            }
        )

        this._setupGlobalTestMethods()
        await this._loadFiles(vitestOpts)
        return this
    }

    hasTests(): boolean {
        return this._hasTests
    }

    async run(): Promise<number> {
        const runner = this._runner!

        let runtimeError: Error | undefined

        try {
            this._suiteStartDate = Date.now()

            await Promise.resolve(executeHooksWithArgs(
                'beforeSuite',
                this._config.beforeSuite as Function,
                [this._buildSuitePayload('beforeSuite')]
            )).catch((e: Error) => {
                log.error(`Error in beforeSuite hook: ${e.stack?.slice(7)}`)
            })

            const specs = this._specs.map((spec) =>
                spec.startsWith(FILE_PROTOCOL) ? url.fileURLToPath(spec) : spec
            )

            await startTests(specs, runner)

            await Promise.resolve(executeHooksWithArgs(
                'afterSuite',
                this._config.afterSuite as Function,
                [this._buildSuitePayload('afterSuite')]
            )).catch((e: Error) => {
                log.error(`Error in afterSuite hook: ${e.stack?.slice(7)}`)
            })
        } catch (err) {
            runtimeError = err as Error
        }

        const result = runtimeError ? 1 : runner.failedCount
        await Promise.resolve(executeHooksWithArgs(
            'after',
            this._config.after as Function,
            [runtimeError || this._specLoadError || result, this._capabilities, this._specs]
        ))

        if (runtimeError || this._specLoadError) {
            throw runtimeError || this._specLoadError
        }

        return result
    }

    wrapHook(hookName: keyof Services.HookFunctions) {
        return () => Promise.resolve(executeHooksWithArgs(
            hookName,
            this._config[hookName] as Function,
            [this._buildSuitePayload(hookName)]
        )).catch((e: Error) => {
            log.error(`Error in ${hookName} hook: ${e.stack?.slice(7)}`)
        })
    }

    private _buildSuitePayload(hookName: string): FrameworkMessage {
        const params: FrameworkMessage = { type: hookName }
        if (hookName === 'afterSuite') {
            params.duration = Date.now() - this._suiteStartDate
        }
        return params
    }

    private _buildRunnerConfig(opts: VitestOpts): VitestRunnerConfig {
        const rootDir = this._config.rootDir || process.cwd()

        let testNamePattern: RegExp | undefined
        if (opts.grep) {
            testNamePattern = opts.grep instanceof RegExp
                ? opts.grep
                : new RegExp(opts.grep)
        }

        return {
            root: rootDir,
            setupFiles: opts.setupFiles || [],
            passWithNoTests: opts.passWithNoTests ?? false,
            testNamePattern,
            allowOnly: true,
            sequence: {
                shuffle: false,
                concurrent: false,
                seed: Date.now(),
                hooks: opts.sequence?.hooks ?? 'parallel',
                setupFiles: 'list',
            },
            maxConcurrency: opts.maxConcurrency ?? 5,
            testTimeout: opts.testTimeout ?? 10000,
            hookTimeout: opts.hookTimeout ?? 10000,
            retry: opts.retry ?? 0,
            includeTaskLocation: false,
            diffOptions: undefined,
        }
    }

    private _setupGlobalTestMethods(): void {
        const g = globalThis as Record<string, unknown>
        g.describe = vitestDescribe
        g.it = vitestIt
        g.test = vitestTest
        g.suite = vitestSuite
        g.beforeAll = vitestBeforeAll
        g.afterAll = vitestAfterAll
        g.beforeEach = vitestBeforeEach
        g.afterEach = vitestAfterEach
        g.before = vitestBeforeAll
        g.after = vitestAfterAll
    }

    async _loadFiles(_vitestOpts: VitestOpts): Promise<void> {
        try {
            for (const spec of this._specs) {
                const filepath = spec.startsWith(FILE_PROTOCOL)
                    ? url.fileURLToPath(spec)
                    : spec
                await this._runner!.importFile(filepath, 'collect')
            }
            this._hasTests = true
        } catch (err) {
            const error = '' +
                'Unable to load spec files quite likely because they rely on `browser` object that is not fully initialized.\n' +
                '`browser` object has only `capabilities` and some flags like `isMobile`.\n' +
                'Helper files that use other `browser` commands have to be moved to `before` hook.\n' +
                `Spec file(s): ${this._specs.join(',')}\n` +
                `Error: ${(err as Error).stack}`
            this._specLoadError = new Error(error)
            this._hasTests = false
            log.warn(error)
        }
    }
}

const adapterFactory: { init?: Function } = {}

adapterFactory.init = async function (...args: unknown[]) {
    // @ts-ignore just passing through args
    const adapter = new VitestAdapter(...args)
    const instance = await adapter.init()
    return instance
}

export default adapterFactory
export { VitestAdapter, adapterFactory }
export * from './types.js'
export type { VitestOpts as VitestOptsConfig } from './types.js'
