import path from 'node:path'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { executeHooksWithArgs } from '@wdio/utils'
import * as Cucumber from '@cucumber/cucumber'
import mockery from 'mockery'
import type * as Messages from '@cucumber/messages'

import type * as Utils from '../src/utils.js'
import * as packageExports from '../src/index.js'

import CucumberAdapter from '../src/index.js'

vi.mock('mockery')
vi.mock('@wdio/utils')
vi.mock('expect-webdriverio')
vi.mock('@cucumber/cucumber')
vi.mock('@cucumber/messages', async () => {
    const module: typeof Messages = await vi.importActual('@cucumber/messages')

    return {
        IdGenerator: {
            uuid: module.IdGenerator.uuid,
            incrementing: vi.fn()
        }
    }
})

vi.mock('../src/reporter', () => ({
    default: class CucumberReporter {
        eventListener = {
            getPickleIds: vi.fn().mockReturnValue(['8']),
            getHookParams: vi.fn().mockReturnValue({ uri: 'uri', feature: 'feature', scenario: 'scenario', step: 'step', result: { 'duration': undefined, 'error': undefined, 'passed': false } })
        }
    }
}))

vi.mock('moduleA', () => {
    global.MODULE_A_WAS_LOADED = true
})
vi.mock('moduleB', () => ({
    default: function moduleB(opts: any) {
        // @ts-ignore
        global.MODULE_B_WAS_LOADED_WITH = opts
    }
}))

vi.mock('../src/utils', async () => {

    const module: typeof Utils = await vi.importActual('../src/utils')

    return {
        ...module,
        setUserHookNames: vi.fn()
    }
})

vi.mock('@cucumber/gherkin-streams', () => ({
    GherkinStreams: { fromPaths: vi.fn().mockReturnValue('GherkinStreams.fromPaths') }
}))

declare global {
    /* eslint-disable no-var */
    var MODULE_A_WAS_LOADED: boolean
    var MODULE_B_WAS_LOADED_WITH: any
    var MODULE_INLINE_WAS_LOADED: boolean
    var MODULE_C_WAS_LOADED: boolean
    /* eslint-enable no-var */
}

describe('CucumberAdapter', () => {
    beforeEach(() => {
        vi.mocked(executeHooksWithArgs).mockClear()
        vi.mocked(Cucumber.setDefinitionFunctionWrapper).mockClear()
        vi.mocked(mockery.enable).mockClear()
        vi.mocked(mockery.registerMock).mockClear()
        vi.mocked(mockery.disable).mockClear()
        vi.mocked(Cucumber.BeforeAll).mockClear()
        vi.mocked(Cucumber.AfterAll).mockClear()
        vi.mocked(Cucumber.Before).mockClear()
        vi.mocked(Cucumber.After).mockClear()
        vi.mocked(Cucumber.BeforeStep).mockClear()
        vi.mocked(Cucumber.AfterStep).mockClear()
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
    })

    it('can be initiated with tests', async () => {
        const adapter = await CucumberAdapter.init!!('0-0', {}, ['/foo/bar'], {}, {})
        expect(executeHooksWithArgs).toBeCalledTimes(0)
        expect(adapter.hasTests()).toBe(true)
    })

    it('should not initiated with no tests', async () => {
        const adapter = await CucumberAdapter.init!!('0-0', {}, [], {}, {})
        expect(executeHooksWithArgs).toBeCalledTimes(0)
        expect(adapter.hasTests()).toBe(false)
    })

    it('can run without errors', async () => {
        const adapter = await CucumberAdapter.init!('0-0', {
            cucumberOpts: { format: [] }
        }, ['/foo/bar'], {}, {})
        adapter.registerRequiredModules = vi.fn()
        adapter.addWdioHooks = vi.fn()
        adapter.loadFiles = vi.fn()

        const result = await adapter.run()
        expect(result).toBe(0)

        expect(adapter.registerRequiredModules).toBeCalledTimes(1)
        expect(adapter.addWdioHooks).toBeCalledTimes(1)
        expect(adapter.loadFiles).toBeCalledTimes(1)
    })

    /**
     * failing due to missing support of dynamic mock imports
     * https://github.com/vitest-dev/vitest/issues/1294
     */
    it.skip('registerRequiredModules', async () => {
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
        }, ['/foo/bar'], {}, {})
        expect(global.MODULE_A_WAS_LOADED).toBe(undefined)
        expect(global.MODULE_A_WAS_LOADED).toBe(undefined)
        expect(global.MODULE_INLINE_WAS_LOADED).toBe(undefined)
        adapter.registerRequiredModules()
        expect(global.MODULE_A_WAS_LOADED).toBe(true)
        expect(global.MODULE_B_WAS_LOADED_WITH).toEqual({ foo: 'bar' })
        expect(global.MODULE_INLINE_WAS_LOADED).toBe(true)
    })

    /**
     * failing due to missing support of dynamic mock imports
     * https://github.com/vitest-dev/vitest/issues/1294
     */
    it.skip('requiredFiles', async () => {
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
                    path.join(__dirname, '__mocks__', 'module*.ts')
                ]
            }
        }, ['/foo/bar'], {}, {})
        expect(adapter.requiredFiles()).toHaveLength(4)
    })

    /**
     * failing due to missing support of dynamic mock imports
     * https://github.com/vitest-dev/vitest/issues/1294
     */
    it.skip('loadSpecFiles', async () => {
        const adapter = await CucumberAdapter.init!('0-0', {}, ['/foo/bar'], {}, {})
        adapter.requiredFiles = vi.fn().mockReturnValue([__dirname + '/__mocks__/moduleC.ts'])

        expect(global.MODULE_C_WAS_LOADED).toBe(undefined)
        adapter.loadSpecFiles()
        expect(global.MODULE_C_WAS_LOADED).toBe(true)

        expect(mockery.enable).toBeCalledTimes(1)
        expect(mockery.registerMock).toBeCalledWith('@cucumber/cucumber', expect.any(Object))
        expect(mockery.disable).toBeCalledTimes(1)
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
            {}
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
                    AfterAll: Cucumber.AfterAll,
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
            pickle: {
                name: 'scenario',
            },
            pickleStep: {
                text: 'step',
            },
        })
        expect(executeHooksWithArgs).toBeCalledWith(
            'beforeStep',
            'beforeStep',
            ['step', 'scenario', cukeWorld]
        )

        // @ts-expect-error
        vi.mocked(Cucumber.AfterStep).mock.calls[0][0].bind(cukeWorld)({
            pickle: {
                name: 'scenario',
            },
            pickleStep: {
                text: 'step',
            },
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
            {}
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
            {}
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
            {}
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
            {}
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
            {}
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
            {}
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
            {}
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
            {}
        )

        expect(adapter.gherkinParser.tokenMatcher.dialect.name).toBe('Danish')
    })
})
