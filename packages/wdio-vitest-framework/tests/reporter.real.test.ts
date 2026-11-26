import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it, vi } from 'vitest'
import { startVitest } from 'vitest/node'
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

            // the reporter opens its file asynchronously (createWriteStream), and waitForSync() does not wait for it
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

describe('WdioBridgeReporter with Vitest json and blob reporters', () => {
    it('strips wdio:runtime entries from json and blob reports while keeping Allure attachments and user meta', async () => {
        const { default: AllureReporter } = await import('../../wdio-allure-reporter/build/index.js')
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-vitest-meta-clean-'))
        const specFile = path.join(tmpDir, 'sample.spec.mjs')
        const jsonFile = path.join(tmpDir, 'report.json')
        const blobFile = path.join(tmpDir, 'report.blob.json')
        const allureDir = path.join(tmpDir, 'allure-results')
        const payloadText = 'A'.repeat(64 * 1024)
        const payloadBase64 = Buffer.from(payloadText).toString('base64')
        try {
            await fs.writeFile(specFile, [
                "import { test } from 'vitest'",
                `const payloadBase64 = ${JSON.stringify(payloadBase64)}`,
                "test('replays and cleans relayed runtime meta', ({ task }) => {",
                "    task.meta.owner = 'checkout'",
                "    task.meta['wdio:runtime'] = [",
                "        { event: 'allure:runtimeMessage', retry: 0, payload: { type: 'step_start', data: { name: 'attach payload', start: 1 } } },",
                "        { event: 'allure:runtimeMessage', retry: 0, payload: { type: 'attachment_content', data: { name: 'big.txt', content: payloadBase64, encoding: 'base64', contentType: 'text/plain', wrapInStep: false, timestamp: 2 } } },",
                "        { event: 'allure:runtimeMessage', retry: 0, payload: { type: 'step_stop', data: { status: 'passed', stop: 3 } } },",
                "        { event: 'wdio:attempt', retry: 0, payload: { start: 1, end: 3, state: 'passed' } }",
                '    ]',
                '})'
            ].join('\n'))

            const bridge = new WdioBridgeReporter({
                framework: 'vitest',
                reporters: [[AllureReporter, { outputDir: allureDir, disableWebdriverStepsReporting: true }]]
            } as unknown as WebdriverIO.Config, () => {})

            const vitest = await startVitest([], { run: true, watch: false, config: false, root: tmpDir }, {
                root: tmpDir,
                configFile: false,
                test: {
                    include: ['sample.spec.mjs'],
                    pool: 'forks',
                    reporters: [
                        ['json', { outputFile: jsonFile }],
                        ['blob', { outputFile: blobFile }],
                        bridge
                    ],
                    provide: { wdioCapabilities: { browserName: 'chrome' } } as never
                }
            })
            await vitest?.close()

            const jsonRaw = await fs.readFile(jsonFile, 'utf8')
            const jsonReport = JSON.parse(jsonRaw)
            expect(jsonReport.testResults[0].assertionResults[0].meta).toEqual({ owner: 'checkout' })
            expect(jsonRaw).not.toContain('wdio:runtime')
            expect(jsonRaw).not.toContain(payloadBase64.slice(0, 128))
            expect(jsonRaw.length).toBeLessThan(payloadBase64.length)

            const blobRaw = await fs.readFile(blobFile, 'utf8')
            expect(blobRaw).toContain('checkout')
            expect(blobRaw).not.toContain('wdio:runtime')
            expect(blobRaw).not.toContain(payloadBase64.slice(0, 128))

            const allureFiles = await fs.readdir(allureDir)
            const resultFile = allureFiles.find((file) => file.endsWith('-result.json'))
            expect(resultFile).toBeDefined()
            const allureResult = JSON.parse(await fs.readFile(path.join(allureDir, resultFile!), 'utf8'))
            expect(allureResult.steps.map((step: { name: string }) => step.name)).toContain('attach payload')
            const step = allureResult.steps.find((item: { name: string }) => item.name === 'attach payload')
            const attachment = step?.attachments?.find((item: { name: string }) => item.name === 'big.txt')
            expect(attachment).toBeDefined()
            expect(await fs.readFile(path.join(allureDir, attachment.source), 'utf8')).toBe(payloadText)
        } finally {
            await fs.rm(tmpDir, { recursive: true, force: true })
        }
    })

    it('strips wdio:runtime from json and blob reports across retries while preserving every Allure attempt', async () => {
        const { default: AllureReporter } = await import('../../wdio-allure-reporter/build/index.js')
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-vitest-meta-retry-'))
        const specFile = path.join(tmpDir, 'retry.spec.mjs')
        const jsonFile = path.join(tmpDir, 'report.json')
        const blobFile = path.join(tmpDir, 'report.blob.json')
        const allureDir = path.join(tmpDir, 'allure-results')
        try {
            await fs.writeFile(specFile, [
                "import { test } from 'vitest'",
                'let attempt = 0',
                "test('retries once and cleans meta', { retry: 1 }, ({ task }) => {",
                '    const retry = attempt++',
                "    task.meta.tag = 'flaky'",
                "    const entries = (task.meta['wdio:runtime'] ??= [])",
                "    entries.push({ event: 'allure:runtimeMessage', retry, payload: { type: 'step_start', data: { name: `attempt-${retry}`, start: retry + 1 } } })",
                "    entries.push({ event: 'allure:runtimeMessage', retry, payload: { type: 'step_stop', data: { status: retry === 0 ? 'failed' : 'passed', stop: retry + 2 } } })",
                '    if (retry === 0) {',
                "        entries.push({ event: 'wdio:attempt', retry, payload: { start: 1, end: 2, state: 'failed', error: { message: 'first try failed' } } })",
                "        throw new Error('first try failed')",
                '    }',
                "    entries.push({ event: 'wdio:attempt', retry, payload: { start: 2, end: 3, state: 'passed' } })",
                '})'
            ].join('\n'))

            const bridge = new WdioBridgeReporter({
                framework: 'vitest',
                reporters: [[AllureReporter, { outputDir: allureDir, disableWebdriverStepsReporting: true }]]
            } as unknown as WebdriverIO.Config, () => {})

            const vitest = await startVitest([], { run: true, watch: false, config: false, root: tmpDir }, {
                root: tmpDir,
                configFile: false,
                test: {
                    include: ['retry.spec.mjs'],
                    pool: 'forks',
                    reporters: [
                        ['json', { outputFile: jsonFile }],
                        ['blob', { outputFile: blobFile }],
                        bridge
                    ],
                    provide: { wdioCapabilities: { browserName: 'chrome' } } as never
                }
            })
            await vitest?.close()

            const jsonRaw = await fs.readFile(jsonFile, 'utf8')
            const jsonReport = JSON.parse(jsonRaw)
            expect(jsonReport.testResults[0].assertionResults[0].meta).toEqual({ tag: 'flaky' })
            expect(jsonRaw).not.toContain('wdio:runtime')

            const blobRaw = await fs.readFile(blobFile, 'utf8')
            expect(blobRaw).toContain('flaky')
            expect(blobRaw).not.toContain('wdio:runtime')

            const resultFiles = (await fs.readdir(allureDir)).filter((file) => file.endsWith('-result.json'))
            expect(resultFiles).toHaveLength(2)
            const results = await Promise.all(resultFiles.map(async (file) => JSON.parse(await fs.readFile(path.join(allureDir, file), 'utf8'))))
            expect(results.flatMap((res) => res.steps.map((step: { name: string }) => step.name)).sort()).toEqual(['attempt-0', 'attempt-1'])
        } finally {
            await fs.rm(tmpDir, { recursive: true, force: true })
        }
    })
})
