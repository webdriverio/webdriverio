import { vi } from 'vitest'

import { EventEmitter } from 'node:events'
import type { Reporters } from '@wdio/types'
import type * as ReporterModule from '../../packages/wdio-reporter/src/index'
import HookStats from '../../packages/wdio-reporter/src/stats/hook.ts'
import RunnerStats from '../../packages/wdio-reporter/src/stats/runner.ts'
import SuiteStats from '../../packages/wdio-reporter/src/stats/suite.ts'
import TestStats from '../../packages/wdio-reporter/src/stats/test.ts'
import { Chalk } from '../chalk.ts'

export default class WDIOReporter extends EventEmitter {
    outputStream: { write: Function }
    failures: number
    suites: Record<string, SuiteStats>
    hooks: Record<string, HookStats>
    tests: Record<string, TestStats>
    currentSuites: SuiteStats[]
    counts: {
        suites: number
        tests: number
        hooks: number
        passes: number
        skipping: number
        failures: number
    }
    retries: number
    _chalk: Chalk
    runnerStat?: RunnerStats
    constructor (public options: Partial<Reporters.Options>) {
        super()
        this.options = options
        this.outputStream = { write: vi.fn() }
        this.failures = 0
        this.suites = {}
        this.hooks = {}
        this.tests = {}
        this.currentSuites = []
        this.counts = {
            suites: 0,
            tests: 0,
            hooks: 0,
            passes: 0,
            skipping: 0,
            failures: 0
        }
        this.retries = 0
        this._chalk = new Chalk(!options.color ? { level : 0 } : {})
    }

    get isSynchronised () {
        return true
    }

    write (content: unknown) {
        this.outputStream.write(content)
    }

    setContextIdResolver (_resolver: () => string | undefined): void {}

    onProcess<Args extends unknown[]> (event: string, handler: (...args: Args) => void): void {
        process.on(event, handler as (...args: unknown[]) => void)
    }

    getContextTest (): TestStats | undefined {
        return undefined
    }

    getContextOwner (): TestStats | HookStats | undefined {
        return this.getContextTest()
    }

    getContextId (): string | undefined {
        return undefined
    }

    parentOf (_stats: unknown): SuiteStats | undefined {
        return undefined
    }

    pathOf (_stats: unknown): SuiteStats[] {
        return []
    }

    depthOf (_stats: unknown): number {
        return 0
    }

    getContextUnit (_contextId?: string): ReporterModule.ReporterUnit | undefined {
        return undefined
    }

    isFeatureHook (hook: unknown): boolean {
        return this.parentOf(hook)?.type === 'feature'
    }

    unitOf (_stats: unknown): ReporterModule.ReporterUnit | undefined {
        return undefined
    }

    hookOwner (_hook: unknown): ReporterModule.ReporterUnit | SuiteStats | undefined {
        return undefined
    }

    unitState<T> (_key: unknown, _init: (unit: ReporterModule.ReporterUnit) => T, _target?: string | ReporterModule.ReporterUnit): T | undefined {
        return undefined
    }

    attemptState<T> (_key: unknown, _init: (unit: ReporterModule.ReporterUnit) => T, _target?: string | ReporterModule.ReporterUnit): T | undefined {
        return undefined
    }

    /* istanbul ignore next */
    onUnitStart (_unit: ReporterModule.ReporterUnit) {}
    /* istanbul ignore next */
    onUnitRetry (_unit: ReporterModule.ReporterUnit) {}
    /* istanbul ignore next */
    onUnitEnd (_unit: ReporterModule.ReporterUnit) {}

    /* istanbul ignore next */
    onRunnerStart () {}
    /* istanbul ignore next */
    onBeforeCommand () {}
    /* istanbul ignore next */
    onAfterCommand () {}
    /* istanbul ignore next */
    onSuiteStart () {}
    /* istanbul ignore next */
    onHookStart () {}
    /* istanbul ignore next */
    onHookEnd () {}
    /* istanbul ignore next */
    onTestStart () {}
    /* istanbul ignore next */
    onTestPass () {}
    /* istanbul ignore next */
    onTestFail () {}
    /* istanbul ignore next */
    onTestSkip () {}
    /* istanbul ignore next */
    onTestEnd () {}
    /* istanbul ignore next */
    onSuiteEnd () {}
    /* istanbul ignore next */
    onRunnerEnd () {}
}
const { getBrowserName, getBrowserNames, getSessionNames, getSessions, sanitizeCaps, knownFramework, hookCountsAsFailure, isContextlessAllHook } = await vi.importActual<typeof ReporterModule>('../../packages/wdio-reporter/src/index')

export { HookStats, RunnerStats, SuiteStats, TestStats, getBrowserName, getBrowserNames, getSessionNames, getSessions, sanitizeCaps, knownFramework, hookCountsAsFailure, isContextlessAllHook }
