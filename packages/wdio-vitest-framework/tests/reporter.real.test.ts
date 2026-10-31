import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it, vi } from 'vitest'
import { BaseReporter } from '@wdio/runner'

import { WdioBridgeReporter } from '../src/reporter.js'

const recorded: [string, Record<string, any>][] = []

class ThrowingReporter {
    isSynchronised = true
    constructor(public options: Record<string, unknown>) {}
    emit(event: string) {
        if (event === 'test:pass') {
            throw new Error('reporter exploded')
        }
    }
}

class RecorderReporter {
    isSynchronised = true
    constructor(public options: Record<string, unknown>) {}
    emit(event: string, payload: Record<string, any>) {
        recorded.push([event, { ...payload }])
    }
}

class ResolverReporter {
    static contextIds: (string | undefined)[] = []
    isSynchronised = true
    resolver?: () => string | undefined
    constructor(public options: Record<string, unknown>) {}
    setContextIdResolver(resolver: () => string | undefined) {
        this.resolver = resolver
    }
    emit(event: string) {
        if (event === 'test:pass') {
            ResolverReporter.contextIds.push(this.resolver?.())
        }
    }
}

describe('WdioBridgeReporter with the real BaseReporter', () => {
    it('hands the context resolver to the reporter instances created by initReporters', async () => {
        ResolverReporter.contextIds = []
        const config = { reporters: [[ResolverReporter, {}]] } as unknown as WebdriverIO.Config
        const bridge = new WdioBridgeReporter(config, () => {})
        const test: any = {
            type: 'test', id: 'concurrent-1', name: 't', parent: undefined,
            result: () => ({ state: 'passed' }), diagnostic: () => ({ duration: 1 }), meta: () => ({}), options: { concurrent: true }
        }
        const module: any = {
            type: 'module', id: 'm', moduleId: '/repo/a.spec.ts', relativeModuleId: 'a.spec.ts',
            project: { config: { provide: { wdioCapabilities: {} } } },
            meta: () => ({}), state: () => 'passed', children: { allTests: () => [test] }
        }
        test.module = module
        test.parent = module

        bridge.onTestModuleStart(module)
        await bridge.onTestCaseReady(test)
        await bridge.onTestCaseResult(test)
        await bridge.onTestModuleEnd(module)

        expect(ResolverReporter.contextIds).toEqual(['concurrent-1'])
    })

    it('delivers ordered events to a configured reporter without mutating the config', async () => {
        recorded.length = 0
        const reporters = [[RecorderReporter, {}]]
        const config = { reporters } as unknown as WebdriverIO.Config
        const events: any[] = []
        const bridge = new WdioBridgeReporter(config, (event) => events.push(event))
        const module: any = {
            type: 'module',
            id: 'chrome-0:/repo/a.spec.ts',
            moduleId: '/repo/a.spec.ts',
            relativeModuleId: 'a.spec.ts',
            project: { config: { provide: { wdioCapabilities: { browserName: 'chrome' } } } },
            meta: () => ({ wdio: { sessionId: 'sess-1', capabilities: { browserVersion: '130' } } }),
            state: () => 'passed',
            children: { allTests: () => [] }
        }
        const suite: any = { type: 'suite', id: 's1', name: 'login', module, parent: module }
        const test: any = {
            type: 'test', id: 't1', name: 'shows form', module, parent: suite,
            result: () => ({ state: 'passed' }), diagnostic: () => ({ duration: 7 }), meta: () => ({}), options: { concurrent: false }
        }

        bridge.onTestModuleStart(module)
        await bridge.onTestSuiteReady(suite)
        await bridge.onTestCaseReady(test)
        await bridge.onTestCaseResult(test)
        await bridge.onTestSuiteResult(suite)
        await bridge.onTestModuleEnd(module)

        expect(recorded.map(([name]) => name)).toEqual(['runner:start', 'suite:start', 'test:start', 'test:pass', 'test:end', 'suite:end', 'runner:end'])
        expect(recorded[0][1]).toMatchObject({ cid: '0-0', sessionId: 'sess-1', capabilities: { browserName: 'chrome', browserVersion: '130', sessionId: 'sess-1' } })
        expect(recorded[3][1]).toMatchObject({ cid: '0-0', duration: 7, passed: true })
        expect(events.map(({ type }) => type)).toEqual(['job:start', 'job:end'])
        expect(events.at(-1)).toMatchObject({ passed: true })
        expect(config.reporters).toBe(reporters)
        expect(reporters).toHaveLength(1)
    })

    it('does not create the default dot reporter when only console reporters are configured', async () => {
        const config = { reporters: ['spec'] as unknown[] } as unknown as WebdriverIO.Config
        const events: any[] = []
        const bridge = new WdioBridgeReporter(config, (event) => events.push(event))
        const module: any = {
            id: 'm', moduleId: '/repo/a.spec.ts', relativeModuleId: 'a.spec.ts',
            project: { config: { provide: { wdioCapabilities: {} } } },
            state: () => 'passed', errors: () => [], meta: () => ({}), children: { allTests: () => [] }
        }
        const init = vi.spyOn(BaseReporter.prototype, 'initReporters')
        bridge.onTestModuleStart(module)
        await bridge.onTestModuleEnd(module)

        expect(config.reporters).toEqual(['spec'])
        expect(events.map(({ type }) => type)).toEqual(['job:start', 'job:end'])
        expect(init).not.toHaveBeenCalled()
        init.mockRestore()
    })

    // BaseReporter.emit isolates each reporter, so a throwing reporter is logged, not propagated
    it('does not fail the job nor count a bridge failure when a reporter throws on an event', async () => {
        const config = { reporters: [[ThrowingReporter, {}]] } as unknown as WebdriverIO.Config
        const events: any[] = []
        const errors: unknown[] = []
        const bridge = new WdioBridgeReporter(config, (event) => events.push(event), (err) => errors.push(err))
        const module: any = {
            type: 'module', id: 'm', moduleId: '/repo/a.spec.ts', relativeModuleId: 'a.spec.ts',
            project: { config: { provide: { wdioCapabilities: {} } } },
            meta: () => ({}), state: () => 'passed', children: { allTests: () => [] }
        }
        const test: any = {
            type: 'test', id: 't1', name: 'good', module, parent: module,
            result: () => ({ state: 'passed' }), diagnostic: () => undefined, meta: () => ({}), options: { concurrent: false }
        }

        bridge.onTestModuleStart(module)
        await bridge.onTestCaseReady(test)
        await bridge.onTestCaseResult(test)
        await bridge.onTestModuleEnd(module)

        expect(errors).toEqual([])
        expect(events.at(-1)).toMatchObject({ type: 'job:end', passed: true })
    })
})

describe('WdioBridgeReporter with the real JUnit reporter', () => {
    it('writes a failure for a module that failed on an import error', async () => {
        // @wdio/junit-reporter is not a dependency of this package; its build is only a test fixture
        const { default: JunitReporter } = await import('../../wdio-junit-reporter/build/index.js')
        const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-vitest-junit-'))
        try {
            const config = { reporters: [[JunitReporter, { outputDir }]] } as unknown as WebdriverIO.Config
            const bridge = new WdioBridgeReporter(config, () => {})
            const module: any = {
                type: 'module', id: 'm', moduleId: '/repo/a.spec.ts', relativeModuleId: 'a.spec.ts',
                project: { config: { provide: { wdioCapabilities: { browserName: 'chrome' } } } },
                meta: () => ({}), state: () => 'failed', errors: () => [{ name: 'Error', message: 'Cannot find module ./missing' }],
                children: { allTests: () => [] }
            }

            bridge.onTestModuleStart(module)
            await bridge.onTestModuleEnd(module)

            await vi.waitFor(async () => {
                const [file] = await fs.readdir(outputDir)
                expect(file).toBeDefined()
                expect(await fs.readFile(path.join(outputDir, file), 'utf8')).toContain('<failure message="Cannot find module ./missing"')
            })
        } finally {
            await fs.rm(outputDir, { recursive: true, force: true })
        }
    })
})

describe('WdioBridgeReporter with the real JUnit and Allure reporters across many spec files', () => {
    it('removes the process listeners of each finished reporter', async () => {
        // the reporters are not dependencies of this package; their builds are only test fixtures
        const { default: JunitReporter } = await import('../../wdio-junit-reporter/build/index.js')
        const { default: AllureReporter } = await import('../../wdio-allure-reporter/build/index.js')
        const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-vitest-listeners-'))
        const events = ['junit:addProperty', 'allure:addTestInfo', 'allure:startStep', 'allure:endStep', 'allure:runtimeMessage']
        const counts = () => events.map((event) => process.listenerCount(event))
        const warnings: Error[] = []
        const onWarning = (warning: Error) => warnings.push(warning)
        process.on('warning', onWarning)
        try {
            const before = counts()
            const config = {
                framework: 'vitest',
                reporters: [[JunitReporter, { outputDir }], [AllureReporter, { outputDir, disableWebdriverStepsReporting: true }]]
            } as unknown as WebdriverIO.Config
            const bridge = new WdioBridgeReporter(config, () => {})
            for (let index = 0; index < 12; index++) {
                const module: any = {
                    type: 'module', id: `m${index}`, moduleId: `/repo/${index}.spec.ts`, relativeModuleId: `${index}.spec.ts`,
                    project: { config: { provide: { wdioCapabilities: { browserName: 'chrome' } } } },
                    meta: () => ({}), state: () => 'passed', errors: () => [], children: { allTests: () => [test] }
                }
                const test: any = {
                    type: 'test', id: `t${index}`, name: 't', module, parent: module,
                    result: () => ({ state: 'passed' }), diagnostic: () => ({ duration: 1 }), meta: () => ({}), options: { concurrent: false }
                }
                bridge.onTestModuleStart(module)
                await bridge.onTestCaseReady(test)
                await bridge.onTestCaseResult(test)
                await bridge.onTestModuleEnd(module)
            }
            await bridge.onTestRunEnd()

            expect(counts()).toEqual(before)
            expect(warnings.filter(({ name }) => name === 'MaxListenersExceededWarning')).toEqual([])
        } finally {
            process.off('warning', onWarning)
            await fs.rm(outputDir, { recursive: true, force: true })
        }
    })
})
