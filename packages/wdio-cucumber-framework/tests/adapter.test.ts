import path from 'node:path'
import type { EventEmitter } from 'node:events'
import { AsyncLocalStorage } from 'node:async_hooks'
import { describe, expect, it, vi, beforeEach, beforeAll } from 'vitest'

import logger from '@wdio/logger'
import { executeHooksWithArgs, testFnWrapper } from '@wdio/utils'
import * as Cucumber from '@cucumber/cucumber'
import type * as Messages from '@cucumber/messages'

import * as packageExports from '../src/index.js'
import { setUserHookNames } from '../src/utils.js'
import CucumberAdapter, { publishCucumberReport } from '../src/index.js'
import { DEFAULT_TIMEOUT } from '../src/constants.js'

vi.mock('fs/promises', async (orig) => ({
    ...(await orig()) as any,
    readdir: vi.fn().mockResolvedValue(['file1.ndjson', 'file2.ndjson']),
    readFile: vi.fn().mockResolvedValueOnce('{"message": "Test 1"}').mockResolvedValueOnce('{"message": "Test 2"}')
}))
vi.mock('@wdio/utils')
vi.mock('@wdio/utils/node')
vi.mock('expect-webdriverio')
vi.mock('@cucumber/cucumber', async (orig) => {

    const { default: _def, ...origMod } = await orig() as typeof Cucumber

    const mod = {
        ...origMod,
        setDefinitionFunctionWrapper: vi.fn(),
        BeforeAll: vi.fn(),
        AfterAll: vi.fn(),
        Before: vi.fn(),
        After: vi.fn(),
        BeforeStep: vi.fn(),
        AfterStep: vi.fn(),
        setDefaultTimeout: vi.fn(),
        supportCodeLibraryBuilder: {
            reset: vi.fn(),
            finalize: vi.fn(),
            methods: {
                BeforeAll: vi.fn(),
                AfterAll: vi.fn(),
                Before: vi.fn(),
                After: vi.fn(),
                BeforeStep: vi.fn(),
                AfterStep: vi.fn(),
            },
        },
        Status: origMod.Status
    }
    return {
        default: mod,
        ...mod
    }
})
vi.mock('@cucumber/messages', async () => {
    const module: typeof Messages = await vi.importActual('@cucumber/messages')

    return {
        IdGenerator: {
            uuid: module.IdGenerator.uuid,
            incrementing: vi.fn()
        }
    }
})

vi.mock('moduleA', () => {
    global.MODULE_A_WAS_LOADED = true
    return {}
})
vi.mock('moduleB', () => ({
    default: function moduleB(opts: any) {
        // @ts-ignore
        global.MODULE_B_WAS_LOADED_WITH = opts
    }
}))

vi.mock('../src/utils.js', async () => {
    const actual: any = await vi.importActual('../src/utils.js')
    return {
        ...actual,
        setUserHookNames: vi.fn(),
    }
})

vi.mock('../src/parallel.js', async () => {
    const actual: any = await vi.importActual('../src/parallel.js')
    return {
        ...actual,
        runParallelCucumber: vi.fn(),
        parallelRunHasStarted: vi.fn().mockReturnValue(false),
    }
})

import { runParallelCucumber, parallelRunHasStarted } from '../src/parallel.js'

declare global {

    var MODULE_A_WAS_LOADED: boolean
    var MODULE_B_WAS_LOADED_WITH: any
    var MODULE_INLINE_WAS_LOADED: boolean
    var MODULE_C_WAS_LOADED: boolean

}

describe('CucumberAdapter', () => {
    beforeEach(() => {
        vi.mocked(executeHooksWithArgs).mockClear()
        vi.mocked(Cucumber.setDefinitionFunctionWrapper).mockClear()
        vi.mocked(Cucumber.BeforeAll).mockClear()
        vi.mocked(Cucumber.AfterAll).mockClear()
        vi.mocked(Cucumber.Before).mockClear()
        vi.mocked(Cucumber.After).mockClear()
        vi.mocked(Cucumber.BeforeStep).mockClear()
        vi.mocked(Cucumber.AfterStep).mockClear()
        vi.mocked(runParallelCucumber).mockClear()
        vi.mocked(parallelRunHasStarted).mockReturnValue(false)
        vi.mocked(setUserHookNames).mockClear()
    })

    it('exports Cucumber exports', () => {
        expect(Object.keys(packageExports))
            .toContain('Given')
        expect(Object.keys(packageExports))
            .toContain('When')
        expect(Object.keys(packageExports))
            .toContain('Then')
        expect(Object.keys(packageExports))
            .toContain('Before')
        expect(Object.keys(packageExports))
            .toContain('After')
        expect(Object.keys(packageExports))
            .toContain('World')
        expect(Object.keys(packageExports))
            .toContain('DataTable')
        expect(Object.keys(packageExports))
            .toContain('world')
        expect(Object.keys(packageExports))
            .toContain('context')
    })

    it('can be initiated with tests', async () => {
        const adapter = await CucumberAdapter.init!('0-0', {}, ['packages/wdio-cucumber-framework/tests/fixtures/test_no_tags.feature'], {}, {}, {}, false, 'progress')
        expect(executeHooksWithArgs).toBeCalledTimes(0)
        expect(adapter.hasTests()).toBe(true)
    })

    it('picks the random order seed once and logs it', async () => {
        const cucumberWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const warn = vi.spyOn(logger('@wdio/cucumber-framework'), 'warn')
        try {
            const adapter = await CucumberAdapter.init!('0-0', { cucumberOpts: { order: 'random' } }, ['packages/wdio-cucumber-framework/tests/fixtures/test_no_tags.feature'], {}, {}, {}, false)
            const [, seed] = (adapter._cucumberOpts.order as string).split(':')
            expect(seed).toMatch(/^\d+$/)
            expect(warn).toHaveBeenCalledWith(`Random order using seed: ${seed}`)
            // loadSources got the seed, so Cucumber did not pick and log its own
            expect(cucumberWarn).not.toHaveBeenCalledWith(expect.stringContaining('Random order using seed'))
        } finally {
            cucumberWarn.mockRestore()
            warn.mockRestore()
        }
    })

    it.each(['defined', 'random:7'])('keeps the order %s', async (order) => {
        const warn = vi.spyOn(logger('@wdio/cucumber-framework'), 'warn')
        try {
            const adapter = await CucumberAdapter.init!('0-0', { cucumberOpts: { order } }, ['packages/wdio-cucumber-framework/tests/fixtures/test_no_tags.feature'], {}, {}, {}, false)
            expect(adapter._cucumberOpts.order).toBe(order)
            expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('Random order using seed'))
        } finally {
            warn.mockRestore()
        }
    })

    it('respects user-defined formatOptions', async () => {

        const formatOptions =  { myFormatter: { MyOption: 'MyValue' } }

        const adapter = await CucumberAdapter.init!('0-0', { cucumberOpts: { formatOptions } }, [], {}, {}, {}, false)

        expect(adapter._cucumberOpts.formatOptions).toEqual(expect.objectContaining(formatOptions))
    })

    it('gives the rootDir of the config to the formatter', async () => {
        const adapter = await CucumberAdapter.init!('0-0', { rootDir: '/my/project', cucumberOpts: { formatOptions: { _rootDir: '/other' } } }, [], {}, {}, {}, false)
        expect(adapter._cucumberOpts.formatOptions._rootDir).toBe('/my/project')
    })

    it('throws if parallel cucumber opts is set', async () => {
        await expect(
            CucumberAdapter.init!('0-0', { cucumberOpts: { parallel: 1 } }, [], {}, {}, {}, false, 'progress')
        ).rejects.toEqual(expect.objectContaining({
            message: 'The option "parallel" is not supported by WebdriverIO'
        }))
    })

    it('throws if tagExpression is set', async () => {
        await expect(
            CucumberAdapter.init!('0-0', { cucumberOpts: { tagExpression: '@smoke' } }, [], {}, {}, {}, false, 'progress')
        ).rejects.toEqual(expect.objectContaining({
            message: 'The option "tagExpression" was removed. Use "tags" instead. See https://github.com/cucumber/cucumber-js/blob/main/UPGRADING.md#1300'
        }))
    })

    it('re-throws parallel execution failure once execution has started', async () => {
        vi.mocked(parallelRunHasStarted).mockReturnValue(true)
        vi.mocked(runParallelCucumber).mockRejectedValue(new Error('parallel boom'))
        ;(globalThis as Record<string, unknown>).browser = { isBidi: true, __bidiCommandsEnabled: true }

        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { parallelMode: 'contexts' } },
            [], {}, {}, {}, false, 'progress'
        )
        ;(adapter as any)._runSequential = vi.fn().mockResolvedValue(0)

        await expect(adapter.run()).rejects.toThrow('parallel boom')
        expect(runParallelCucumber).toHaveBeenCalledTimes(1)
        // No sequential fallback — scenarios/hooks may already have run
        expect((adapter as any)._runSequential).not.toHaveBeenCalled()
        delete (globalThis as Record<string, unknown>).browser
    })

    it('gives the rootDir of the config to the parallel run', async () => {
        vi.mocked(runParallelCucumber).mockResolvedValue(0)
        ;(globalThis as Record<string, unknown>).browser = { isBidi: true, __bidiCommandsEnabled: true }

        const adapter = await CucumberAdapter.init!(
            '0-0',
            { rootDir: '/my/project', cucumberOpts: { parallelMode: 'contexts' } },
            [], {}, {}, {}, false, 'progress'
        )
        await adapter.run()
        expect(vi.mocked(runParallelCucumber).mock.calls[0][0].rootDir).toBe('/my/project')
        delete (globalThis as Record<string, unknown>).browser
    })

    it('falls back to sequential when parallel execution failed before starting', async () => {
        vi.mocked(parallelRunHasStarted).mockReturnValue(false)
        vi.mocked(runParallelCucumber).mockRejectedValue(new Error('parallel boom'))
        ;(globalThis as Record<string, unknown>).browser = { isBidi: true, __bidiCommandsEnabled: true }

        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { parallelMode: 'contexts' } },
            [], {}, {}, {}, false, 'progress'
        )
        ;(adapter as any)._runSequential = vi.fn().mockResolvedValue(0)

        const result = await adapter.run()
        expect(result).toBe(0)
        expect(runParallelCucumber).toHaveBeenCalledTimes(1)
        expect((adapter as any)._runSequential).toHaveBeenCalledTimes(1)
        delete (globalThis as Record<string, unknown>).browser
    })

    it('accepts userContexts and never falls back to sequential on pre-start failure', async () => {
        vi.mocked(parallelRunHasStarted).mockReturnValue(false)
        vi.mocked(runParallelCucumber).mockRejectedValue(new Error('no createUserContext'))
        ;(globalThis as Record<string, unknown>).browser = { isBidi: true, __bidiCommandsEnabled: true }

        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { parallelMode: 'userContexts' } },
            [], {}, {}, {}, false, 'progress'
        )
        ;(adapter as any)._runSequential = vi.fn().mockResolvedValue(0)

        await expect(adapter.run()).rejects.toThrow('no createUserContext')
        expect(runParallelCucumber).toHaveBeenCalledTimes(1)
        expect((adapter as any)._runSequential).not.toHaveBeenCalled()
        delete (globalThis as Record<string, unknown>).browser
    })

    it('reads the feature file of a spec with line numbers in parallel mode', async () => {
        vi.mocked(runParallelCucumber).mockResolvedValue(0)
        ;(globalThis as Record<string, unknown>).browser = { isBidi: true, __bidiCommandsEnabled: true }
        const feature = path.join(__dirname, 'fixtures', 'test_no_tags.feature')

        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { parallelMode: 'contexts' }, cucumberFeaturesWithLineNumbers: [`${feature}:7`] },
            [feature], {}, {}, {}, false, 'progress'
        )
        await adapter.run()

        const [{ specs, gherkinDocuments }] = vi.mocked(runParallelCucumber).mock.calls[0]
        // the line numbers stay for Cucumber's line filter, the document has the file
        expect(specs).toEqual([`${feature}:7`])
        expect(gherkinDocuments.flat().map((doc) => doc.uri)).toEqual([feature])
        delete (globalThis as Record<string, unknown>).browser
    })

    it('uses the browser from setBrowser without globalThis.browser', async () => {
        vi.mocked(runParallelCucumber).mockResolvedValue(0)
        delete (globalThis as Record<string, unknown>).browser
        const browser = { isBidi: true, __bidiCommandsEnabled: true } as unknown as WebdriverIO.Browser

        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { parallelMode: 'contexts' } },
            [], {}, {}, {}, false, 'progress'
        )
        adapter.setBrowser(browser)

        await adapter.run()
        expect(runParallelCucumber).toHaveBeenCalledWith(expect.objectContaining({ browser }))
    })

    it('applies tags from cucumberOpts.profiles to parallel scenario selection', async () => {
        vi.mocked(runParallelCucumber).mockResolvedValue(0)
        const browser = { isBidi: true, __bidiCommandsEnabled: true } as unknown as WebdriverIO.Browser

        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: {
                parallelMode: 'contexts',
                tags: '@fast',
                profiles: ['smoke'],
                file: 'packages/wdio-cucumber-framework/tests/fixtures/cucumber.profiles.json',
            } },
            [], {}, {}, {}, false, 'progress'
        )
        adapter.setBrowser(browser)

        await adapter.run()
        expect(runParallelCucumber).toHaveBeenCalledWith(expect.objectContaining({
            cucumberOpts: expect.objectContaining({ tags: '(@smoke) and (@fast)' }),
        }))
    })

    it('prefers the setBrowser browser over globalThis.browser', async () => {
        vi.mocked(runParallelCucumber).mockResolvedValue(0)
        ;(globalThis as Record<string, unknown>).browser = { isBidi: true, __bidiCommandsEnabled: true, from: 'global' }
        const browser = { isBidi: true, __bidiCommandsEnabled: true, from: 'set' } as unknown as WebdriverIO.Browser

        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { parallelMode: 'contexts' } },
            [], {}, {}, {}, false, 'progress'
        )
        adapter.setBrowser(browser)

        await adapter.run()
        expect(runParallelCucumber).toHaveBeenCalledWith(expect.objectContaining({ browser }))
        delete (globalThis as Record<string, unknown>).browser
    })

    it('throws when neither setBrowser nor globalThis.browser provides a browser', async () => {
        delete (globalThis as Record<string, unknown>).browser
        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { parallelMode: 'contexts' } },
            [], {}, {}, {}, false, 'progress'
        )

        await expect(adapter.run()).rejects.toThrow('requires a browser instance')
    })

    it('should not initiated with no tests', async () => {
        const adapter = await CucumberAdapter.init!('0-0', {}, [], {}, {}, {}, false, 'progress')
        expect(executeHooksWithArgs).toBeCalledTimes(0)
        expect(adapter.hasTests()).toBe(false)
    })

    it('can run without errors', async () => {
        const adapter = await CucumberAdapter.init!('0-0', {
            cucumberOpts: { format: [] }
        }, ['/foo/bar'], {}, {}, {}, false, 'progress')
        adapter.registerRequiredModules = vi.fn()
        adapter.addWdioHooks = vi.fn()
        adapter.loadFiles = vi.fn()

        const result = await adapter.run()
        expect(result).toBe(0)

        expect(adapter.registerRequiredModules).toBeCalledTimes(1)
        expect(adapter.addWdioHooks).toBeCalledTimes(1)
        expect(adapter.loadFiles).toBeCalledTimes(1)
        expect(setUserHookNames).toBeCalledTimes(1)
    })

    it('registerRequiredModules', async () => {
        const adapter = await CucumberAdapter.init!('0-0', {
            cucumberOpts: {
                requireModule: [
                    'moduleA',
                    ['moduleB', { foo: 'bar' }],
                    () => {
                        // @ts-ignore
                        global.MODULE_INLINE_WAS_LOADED = true
                    }
                ]
            }
        }, ['/foo/bar'], {}, {}, {}, false, 'progress')
        expect(global.MODULE_A_WAS_LOADED).toBe(undefined)
        expect(global.MODULE_A_WAS_LOADED).toBe(undefined)
        expect(global.MODULE_INLINE_WAS_LOADED).toBe(undefined)
        await adapter.registerRequiredModules()
        expect(global.MODULE_A_WAS_LOADED).toBe(true)
        expect(global.MODULE_B_WAS_LOADED_WITH).toEqual({ foo: 'bar' })
        expect(global.MODULE_INLINE_WAS_LOADED).toBe(true)
    })

    it('loadFilesWithType', async () => {
        /**
         * skip for windows which for some reasons only can find one entry, e.g.:
         * D:\\a\\webdriverio\\webdriverio\\packages\\wdio-cucumber-framework\\tests\\adapter.test.ts
         */
        if (process.platform === 'win32') {
            return
        }

        const adapter = await CucumberAdapter.init!('0-0', {
            cucumberOpts: {
                require: [
                    __filename,
                    path.join(process.cwd(), '__mocks__', 'module*.ts')
                ]
            }
        }, ['/foo/bar'], {}, {}, {}, false, 'progress')

        expect(await adapter.loadFilesWithType(adapter._cucumberOpts.require)).toHaveLength(4)
    })

    it('loadSpecFiles', async () => {
        const adapter = await CucumberAdapter.init!('0-0', {}, ['/foo/bar'], {}, {}, {}, false, 'progress')
        adapter.loadFilesWithType = vi.fn().mockReturnValue([path.resolve(process.cwd(), '__mocks__', 'moduleC.ts')])

        expect(global.MODULE_C_WAS_LOADED).toBe(undefined)
        await adapter.loadFiles()
        expect(global.MODULE_C_WAS_LOADED).toBe(true)
    })

    it('addWdioHooks', async () => {
        class CustomWorld {
            public foo = 'bar'
        }
        const cukeWorld = new CustomWorld()

        const adapter = await CucumberAdapter.init!(
            '0-0',
            {
                cucumberOpts: { format: [] },
            },
            ['/foo/bar'],
            {},
            {},
            {},
            false,
            'progress'
        )
        adapter.addWdioHooks(
            {
                beforeFeature: 'beforeFeature',
                afterFeature: 'afterFeature',
                beforeScenario: 'beforeScenario',
                afterScenario: 'afterScenario',
                beforeStep: 'beforeStep',
                afterStep: 'afterStep',
            },
            {
                methods: {
                    BeforeAll: Cucumber.BeforeAll,
                    Before: Cucumber.Before,
                    BeforeStep: Cucumber.BeforeStep,
                    AfterStep: Cucumber.AfterStep,
                    After: Cucumber.After,
                    AfterAll: Cucumber.AfterAll
                },
            }
        )
        expect(Cucumber.BeforeAll).toBeCalledTimes(1)
        expect(Cucumber.Before).toBeCalledTimes(1)
        expect(Cucumber.BeforeStep).toBeCalledTimes(1)
        expect(Cucumber.AfterStep).toBeCalledTimes(1)
        expect(Cucumber.After).toBeCalledTimes(1)
        expect(Cucumber.AfterAll).toBeCalledTimes(1)

        expect(executeHooksWithArgs).toBeCalledTimes(0)

        // @ts-expect-error
        vi.mocked(Cucumber.BeforeAll).mock.calls[0][0]()
        expect(executeHooksWithArgs).toBeCalledWith(
            'beforeFeature',
            'beforeFeature',
            [undefined, undefined]
        )

        // @ts-expect-error
        vi.mocked(Cucumber.Before).mock.calls[0][0].bind(cukeWorld)('world')
        expect(executeHooksWithArgs).toBeCalledWith(
            'beforeScenario',
            'beforeScenario',
            ['world', cukeWorld]
        )

        // @ts-expect-error
        vi.mocked(Cucumber.BeforeStep).mock.calls[0][0].bind(cukeWorld)({
            pickle: 'scenario',
            pickleStep: 'step',
        })
        expect(executeHooksWithArgs).toBeCalledWith(
            'beforeStep',
            'beforeStep',
            ['step', 'scenario', cukeWorld]
        )

        // @ts-expect-error
        vi.mocked(Cucumber.AfterStep).mock.calls[0][0].bind(cukeWorld)({
            pickle: 'scenario',
            pickleStep: 'step',
            result: {
                duration: NaN,
                error: undefined,
                passed: false,
            },
        })
        expect(executeHooksWithArgs).toBeCalledWith('afterStep', 'afterStep', [
            'step',
            'scenario',
            { duration: NaN, error: undefined, passed: false },
            cukeWorld,
        ])

        // @ts-expect-error
        vi.mocked(Cucumber.After).mock.calls[0][0].bind(cukeWorld)('world')
        expect(executeHooksWithArgs).toBeCalledWith(
            'afterScenario',
            'afterScenario',
            [
                'world',
                { duration: NaN, error: undefined, passed: false },
                cukeWorld,
            ]
        )

        // @ts-expect-error
        vi.mocked(Cucumber.AfterAll).mock.calls[0][0]()
        expect(executeHooksWithArgs).toBeCalledWith(
            'afterFeature',
            'afterFeature',
            [undefined, undefined]
        )
    })

    it('can run when filtering by tag at Feature level', async () => {
        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { tags: '@runall', format: [], dryRun: true } },
            [
                'packages/wdio-cucumber-framework/tests/fixtures/test_tags.feature',
                'packages/wdio-cucumber-framework/tests/fixtures/test_no_tags.feature',
            ],
            {},
            {},
            {},
            false,
            'progress'
        )

        expect(adapter._specs).toHaveLength(1)
        expect(adapter._hasTests).toBe(true)

        adapter.registerRequiredModules = vi.fn()
        adapter.addWdioHooks = vi.fn()
        adapter.loadFiles = vi.fn()

        const result = await adapter.run()

        expect(result).toBe(0)
        expect(executeHooksWithArgs).toBeCalledTimes(1)
    })

    it('can run when filtering by tag at root Scenario level', async () => {
        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { tags: '@run', format: [], dryRun: true } },
            [
                'packages/wdio-cucumber-framework/tests/fixtures/test_tags.feature',
                'packages/wdio-cucumber-framework/tests/fixtures/test_no_tags.feature',
            ],
            {},
            {},
            {},
            false,
            'progress'
        )

        expect(adapter._specs).toHaveLength(1)
        expect(adapter._hasTests).toBe(true)

        adapter.registerRequiredModules = vi.fn()
        adapter.addWdioHooks = vi.fn()
        adapter.loadFiles = vi.fn()

        const result = await adapter.run()

        expect(result).toBe(0)
        expect(executeHooksWithArgs).toBeCalledTimes(1)
    })

    it('can run when filtering by tag at Rule level', async () => {
        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { tags: '@runrule', format: [], dryRun: true } },
            [
                'packages/wdio-cucumber-framework/tests/fixtures/test_tags.feature',
                'packages/wdio-cucumber-framework/tests/fixtures/test_no_tags.feature',
            ],
            {},
            {},
            {},
            false,
            'progress'
        )

        expect(adapter._specs).toHaveLength(1)
        expect(adapter._hasTests).toBe(true)

        adapter.registerRequiredModules = vi.fn()
        adapter.addWdioHooks = vi.fn()
        adapter.loadFiles = vi.fn()

        const result = await adapter.run()

        expect(result).toBe(0)
        expect(executeHooksWithArgs).toBeCalledTimes(1)
    })

    it('can run when filtering by tag at Scenario within Rule', async () => {
        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { tags: '@runinrule', format: [], dryRun: true } },
            [
                'packages/wdio-cucumber-framework/tests/fixtures/test_tags.feature',
                'packages/wdio-cucumber-framework/tests/fixtures/test_no_tags.feature',
            ],
            {},
            {},
            {},
            false,
            'progress'
        )

        expect(adapter._specs).toHaveLength(1)
        expect(adapter._hasTests).toBe(true)

        adapter.registerRequiredModules = vi.fn()
        adapter.addWdioHooks = vi.fn()
        adapter.loadFiles = vi.fn()

        const result = await adapter.run()

        expect(result).toBe(0)
        expect(executeHooksWithArgs).toBeCalledTimes(1)
    })

    it('can run when filtering by non-existent tag', async () => {
        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { tags: '@notpresent', format: [], dryRun: true } },
            [
                'packages/wdio-cucumber-framework/tests/fixtures/test_tags.feature',
                'packages/wdio-cucumber-framework/tests/fixtures/test_no_tags.feature',
            ],
            {},
            {},
            {},
            false,
            'progress'
        )

        expect(adapter._specs).toHaveLength(0)
        expect(adapter._hasTests).toBe(false)

        adapter.registerRequiredModules = vi.fn()
        adapter.addWdioHooks = vi.fn()
        adapter.loadFiles = vi.fn()

        const result = await adapter.run()

        expect(result).toBe(0)
        expect(executeHooksWithArgs).toBeCalledTimes(1)
    })

    it('can run when filtering by tag at example level', async () => {
        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { tags: '@runExample', format: [], dryRun: true } },
            [
                'packages/wdio-cucumber-framework/tests/fixtures/test_tags.feature',
                'packages/wdio-cucumber-framework/tests/fixtures/test_no_tags.feature',
            ],
            {},
            {},
            {},
            false,
            'progress'
        )

        expect(adapter._specs).toHaveLength(1)
        expect(adapter._hasTests).toBe(true)

        adapter.registerRequiredModules = vi.fn()
        adapter.addWdioHooks = vi.fn()
        adapter.loadFiles = vi.fn()

        const result = await adapter.run()

        expect(result).toBe(0)
        expect(executeHooksWithArgs).toBeCalledTimes(1)
    })

    it('can run when filtering by cucumber tag-expression', async () => {
        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { tags: '@runall and @tagAtLine', format: [], dryRun: true } },
            [
                'packages/wdio-cucumber-framework/tests/fixtures/test_tags.feature',
                'packages/wdio-cucumber-framework/tests/fixtures/test_no_tags.feature',
            ],
            {},
            {},
            {},
            false,
            'progress'
        )

        expect(adapter._specs).toHaveLength(1)
        expect(adapter._hasTests).toBe(true)

        adapter.registerRequiredModules = vi.fn()
        adapter.addWdioHooks = vi.fn()
        adapter.loadFiles = vi.fn()

        const result = await adapter.run()

        expect(result).toBe(0)
        expect(executeHooksWithArgs).toBeCalledTimes(1)
    })

    it('can set a default language for feature files', async () => {
        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { language: 'da', format: [], dryRun: true } },
            [
                'packages/wdio-cucumber-framework/tests/fixtures/test_tags.feature',
            ],
            {},
            {},
            {},
            false,
            'progress'
        )

        expect(adapter.gherkinParser.tokenMatcher.dialect.name).toBe('Danish')
    })

    it('can run when filtering by name', async () => {
        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { name: ['Scenario #2'], format: [], dryRun: true } },
            [
                'packages/wdio-cucumber-framework/tests/fixtures/test_tags.feature',
                'packages/wdio-cucumber-framework/tests/fixtures/test_no_tags.feature',
            ],
            {},
            {},
            {},
            false,
            'progress'
        )

        expect(adapter._specs).toHaveLength(2)
        expect(adapter._hasTests).toBe(true)

        adapter.registerRequiredModules = vi.fn()
        adapter.addWdioHooks = vi.fn()
        adapter.loadFiles = vi.fn()

        const result = await adapter.run()

        expect(result).toBe(0)
        expect(executeHooksWithArgs).toBeCalledTimes(1)
    })

    it('can run when filtering by name & tags', async () => {
        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { name: ['Scenario #2'], tags: '@runall', format: [], dryRun: true } },
            [
                'packages/wdio-cucumber-framework/tests/fixtures/test_tags.feature',
                'packages/wdio-cucumber-framework/tests/fixtures/test_no_tags.feature',
            ],
            {},
            {},
            {},
            false,
            'progress'
        )

        expect(adapter._specs).toHaveLength(1)
        expect(adapter._hasTests).toBe(true)

        adapter.registerRequiredModules = vi.fn()
        adapter.addWdioHooks = vi.fn()
        adapter.loadFiles = vi.fn()

        const result = await adapter.run()

        expect(result).toBe(0)
        expect(executeHooksWithArgs).toBeCalledTimes(1)
    })

    it('should skip test if `skip` tag condition is matched', async () => {
        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { format: [], dryRun: true } },
            [
                'packages/wdio-cucumber-framework/tests/fixtures/test_skip.feature',
            ],
            { browserName: 'chrome' },
            {},
            {},
            true,
            'progress'
        )

        expect(adapter._specs).toHaveLength(0)
        expect(adapter.hasTests()).toBe(false)

        adapter.registerRequiredModules = vi.fn()
        adapter.addWdioHooks = vi.fn()
        adapter.loadFiles = vi.fn()

        const result = await adapter.run()

        expect(result).toBe(0)
        expect(executeHooksWithArgs).toBeCalledTimes(1)
    })

    it('should wrap user tag expressions so `or` can not bypass generated skip tags', async () => {
        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { format: [], dryRun: true, tags: '@a or @b' } },
            ['packages/wdio-cucumber-framework/tests/fixtures/test_skip.feature'],
            { browserName: 'chrome' },
            {},
            {},
            true,
            'progress'
        )

        expect(adapter['_cucumberOpts'].tags).toMatch(/^\(not @skip.*\) and \(@a or @b\)$/)
    })

    it('should not add parentheses when there are no user tags', async () => {
        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { format: [], dryRun: true } },
            ['packages/wdio-cucumber-framework/tests/fixtures/test_skip.feature'],
            { browserName: 'chrome' },
            {},
            {},
            true,
            'progress'
        )

        expect(adapter['_cucumberOpts'].tags).not.toContain('(@')
        expect(adapter['_cucumberOpts'].tags).toMatch(/^\(not @skip.*\)$/)
    })

    it('should keep only the wrapped user tags when no skip tags are generated', async () => {
        const adapter = await CucumberAdapter.init!(
            '0-0',
            { cucumberOpts: { format: [], dryRun: true, tags: '@a or @b' } },
            ['packages/wdio-cucumber-framework/tests/fixtures/test_skip.feature'],
            { browserName: 'foobar' },
            {},
            {},
            true,
            'progress'
        )

        expect(adapter['_cucumberOpts'].tags).toMatch(/\(@a or @b\)$/)
    })

    it('wrapSteps should not call wrapStep if step doesn\'t has wrapperOptions', async () => {
        const adapter = await CucumberAdapter.init!('0-0', {}, ['/foo/bar'], {}, {}, {}, false, 'progress')
        adapter.wrapStep  = vi.fn()
        expect(adapter.wrapStep).toBeCalledTimes(0)
        adapter.wrapSteps()
        expect(Cucumber.setDefinitionFunctionWrapper).toBeCalledTimes(1)
        vi.mocked(Cucumber.setDefinitionFunctionWrapper).mock.calls[0][0](vi.fn())
        expect(adapter.wrapStep).not.toBeCalled()
    })

    it('wrapSteps should call wrapStep if step has wrapperOptions', async () => {
        const adapter = await CucumberAdapter.init!('0-0', {}, ['/foo/bar'], {}, {}, {}, false, 'progress')
        const wrapperOptions = { retry: 1 }
        adapter.wrapStep  = vi.fn()
        expect(adapter.wrapStep).toBeCalledTimes(0)
        adapter.wrapSteps()
        expect(Cucumber.setDefinitionFunctionWrapper).toBeCalledTimes(1)
        vi.mocked(Cucumber.setDefinitionFunctionWrapper).mock.calls[0][0](vi.fn(), wrapperOptions)
        expect(adapter.wrapStep).toBeCalledWith(
            expect.any(Function),
            true,
            undefined,
            '0-0',
            { retry: 1 },
            expect.any(Function),
            DEFAULT_TIMEOUT
        )
    })

    it('wrapSteps should not wrap wdio hooks', async () => {
        const adapter = await CucumberAdapter.init!('0-0', {}, ['/foo/bar'], {}, {}, {}, false, 'progress')
        adapter.wrapStep  = vi.fn()
        expect(adapter.wrapStep).toBeCalledTimes(0)
        adapter.wrapSteps()
        function wdioHookFn () { return 'foobar' }
        expect(Cucumber.setDefinitionFunctionWrapper).toBeCalledTimes(1)
        expect(
            vi.mocked(Cucumber.setDefinitionFunctionWrapper).mock.calls[0][0](wdioHookFn)()
        ).toBe('foobar')
    })

    it('wrapSteps keeps getHookParams per parallel context', async () => {
        const store = new AsyncLocalStorage<string>()
        const adapter = await CucumberAdapter.init!('0-0', {}, ['/foo/bar'], {}, {}, {}, false, 'progress')
        adapter.setBrowser({ __parallelContextStore: store } as never)
        adapter.wrapSteps({} as never)
        const emitter = (adapter as unknown as { _eventEmitter: EventEmitter })._eventEmitter
        const wrap = vi.mocked(Cucumber.setDefinitionFunctionWrapper).mock.calls[0][0]
        const wrapped = wrap(vi.fn(), { retry: 1 }) as () => void
        vi.mocked(testFnWrapper).mockClear()

        store.run('ctx-a', () => emitter.emit('getHookParams', { step: 'stepA' }))
        store.run('ctx-b', () => emitter.emit('getHookParams', { step: 'stepB' }))
        store.run('ctx-a', () => wrapped.call({}))
        store.run('ctx-b', () => wrapped.call({}))

        const stepsSeen = vi.mocked(testFnWrapper).mock.calls.map((call) => {
            const beforeFnArgs = (call[2] as { beforeFnArgs: (c: unknown) => unknown[] }).beforeFnArgs
            return beforeFnArgs('ctx')[0]
        })
        expect(stepsSeen).toEqual(['stepA', 'stepB'])
    })

    it('wrapStep', async () => {
        const adapter = await CucumberAdapter.init!('0-0', {}, ['/foo/bar'], {}, {}, {}, false, 'progress')
        const wrappedStep = adapter.wrapStep('code', true, {}, '0-2', {}, () => 'hookParams')
        expect(testFnWrapper).toBeCalledTimes(0)
        wrappedStep('someWorld', 1, 2, 3)
        expect(vi.mocked(testFnWrapper).mock.calls).toMatchSnapshot()
    })
})

describe('publishCucumberReport', () => {
    beforeAll(() => {
        vi.spyOn(global, 'fetch').mockImplementation((url: string | URL | globalThis.Request) => {
            if (/\/api\/reports/.test(url as string)) {
                return Promise.resolve(Response.json({}, {
                    headers: {
                        location: 'https://example.com/reports/12345'
                    }
                }))
            }
            return Promise.resolve(Response.json({}))
        })
    })

    it('should not publish report if CUCUMBER_PUBLISH_REPORT_TOKEN is not set', async () => {
        await publishCucumberReport('/some/directory')
        expect(fetch).not.toHaveBeenCalled()
    })

    it('should publish report successfully', async () => {
        process.env.CUCUMBER_PUBLISH_REPORT_TOKEN = 'some-token'
        process.env.CUCUMBER_PUBLISH_REPORT_URL = 'https://example.com/api/reports'

        await publishCucumberReport('./')

        expect(fetch).toHaveBeenCalledWith('https://example.com/api/reports', {
            method: 'get',
            headers: {
                Authorization: 'Bearer some-token'
            }
        })

        expect(fetch).toHaveBeenCalledWith('https://example.com/reports/12345', {
            method: 'put',
            headers: {
                'Content-Type': 'application/json'
            },
            body: '{"message": "Test 1"}{"message": "Test 2"}'
        })
    })
})
