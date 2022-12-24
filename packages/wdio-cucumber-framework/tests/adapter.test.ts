import path from 'node:path'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { executeHooksWithArgs, testFnWrapper } from '@wdio/utils'
import * as Cucumber from '@cucumber/cucumber'
import mockery from 'mockery'

import CucumberAdapter from '../src/index.js'
import { setUserHookNames } from '../src/utils.js'
import * as packageExports from '../src/index.js'

vi.mock('mockery')
vi.mock('@wdio/utils')
vi.mock('expect-webdriverio')
vi.mock('@cucumber/cucumber')
vi.mock('@cucumber/messages', () => ({ IdGenerator: { incrementing: vi.fn() } }))
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
    default: function moduleB (opts: any) {
        // @ts-ignore
        global.MODULE_B_WAS_LOADED_WITH = opts
    }
}))

vi.mock('../src/utils', () => ({
    setUserHookNames: vi.fn()
}))

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
        vi.mocked(Cucumber.PickleFilter).mockClear()
        vi.mocked(executeHooksWithArgs).mockClear()
        vi.mocked(Cucumber.Runtime).mockClear()
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
        const adapter = await CucumberAdapter.init!!('0-0', {
            cucumberOpts: { names: 'FeatureA,FeatureB' }
        }, ['/foo/bar'], {}, {})

        expect(executeHooksWithArgs).toBeCalledTimes(0)
        expect(adapter.hasTests()).toBe(true)
        expect(Cucumber.PickleFilter).toBeCalledWith({
            cwd: expect.any(String),
            featurePaths: ['/foo/bar'],
            names: ['FeatureA', 'FeatureB'],
            tagExpression: ''
        })
    })

    it('should trigger after hook if initiation fails', async () => {
        vi.mocked(Cucumber.parseGherkinMessageStream)
            .mockRejectedValueOnce(new Error('boom'))

        const err = await CucumberAdapter.init!('0-0', {
            cucumberFeaturesWithLineNumbers: ['/bar/foo', '/foo/bar']
        }, ['/foo/bar'], {}, {})
            .catch((err: any) => err)
        expect(err.message).toBe('boom')
        expect(executeHooksWithArgs).toBeCalledTimes(1)
        expect(Cucumber.PickleFilter).toBeCalledWith({
            cwd: expect.any(String),
            featurePaths: ['/bar/foo', '/foo/bar'],
            names: [],
            tagExpression: ''
        })
    })

    it('can run without errors', async () => {
        const adapter = await CucumberAdapter.init!('0-0', {}, ['/foo/bar'], {}, {})
        adapter.registerRequiredModules = vi.fn()
        adapter.addWdioHooks = vi.fn()
        adapter.loadSpecFiles = vi.fn()

        const result = await adapter.run()
        expect(result).toBe(0)

        expect(adapter.registerRequiredModules).toBeCalledTimes(1)
        expect(adapter.addWdioHooks).toBeCalledTimes(1)
        expect(adapter.loadSpecFiles).toBeCalledTimes(1)
        expect(setUserHookNames).toBeCalledTimes(1)
    })

    it('can run with failing result', async () => {
        const adapter = await CucumberAdapter.init!('0-0', {
            cucumberOpts: { shouldFail: 123 }
        }, ['/foo/bar'], {}, {})
        const result = await adapter.run()
        expect(result).toBe(1)
        expect(executeHooksWithArgs).toBeCalledTimes(1)
    })

    it('can take cucumber report failure count', async () => {
        const adapter = await CucumberAdapter.init!('0-0', {
            cucumberOpts: {
                shouldFail: 123,
                ignoreUndefinedDefinitions: true
            }
        }, ['/foo/bar'], {}, {})
        adapter._cucumberReporter.failedCount = 123
        const result = await adapter.run()
        expect(result).toBe(123)
        expect(executeHooksWithArgs).toBeCalledTimes(1)
    })

    it('should throw if there was a runtime error', async () => {
        const adapter = await CucumberAdapter.init!('0-0', {
            cucumberOpts: { shouldThrow: 'some error' }
        }, ['/foo/bar'], {}, {})
        const err = await adapter.run().catch((err: any) => err)
        expect(err.message).toBe('some error')
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

        const adapter = await CucumberAdapter.init!('0-0', {}, ['/foo/bar'], {}, {})
        adapter.addWdioHooks({
            beforeFeature: 'beforeFeature',
            afterFeature: 'afterFeature',
            beforeScenario: 'beforeScenario',
            afterScenario: 'afterScenario',
            beforeStep: 'beforeStep',
            afterStep: 'afterStep'
        })
        expect(Cucumber.BeforeAll).toBeCalledTimes(1)
        expect(Cucumber.AfterAll).toBeCalledTimes(1)
        expect(Cucumber.Before).toBeCalledTimes(1)
        expect(Cucumber.After).toBeCalledTimes(1)
        expect(Cucumber.BeforeStep).toBeCalledTimes(1)
        expect(Cucumber.AfterStep).toBeCalledTimes(1)
        expect(executeHooksWithArgs).toBeCalledTimes(0)

        // @ts-expect-error
        vi.mocked(Cucumber.AfterStep).mock.calls[0][0].bind(cukeWorld)('world')
        expect(executeHooksWithArgs)
            .toBeCalledWith('afterStep', 'afterStep', ['step', 'scenario', { 'duration': NaN, 'error': undefined, 'passed': false }, cukeWorld])
        // @ts-expect-error
        vi.mocked(Cucumber.BeforeStep).mock.calls[0][0].bind(cukeWorld)()
        expect(executeHooksWithArgs)
            .toBeCalledWith('beforeStep', 'beforeStep', ['step', 'scenario', cukeWorld])
        // @ts-expect-error
        vi.mocked(Cucumber.BeforeAll).mock.calls[0][0]()
        expect(executeHooksWithArgs)
            .toBeCalledWith('beforeFeature', 'beforeFeature', ['uri', 'feature'])
        // @ts-expect-error
        vi.mocked(Cucumber.AfterAll).mock.calls[0][0]()
        expect(executeHooksWithArgs)
            .toBeCalledWith('afterFeature', 'afterFeature', ['uri', 'feature'])
        // @ts-expect-error
        vi.mocked(Cucumber.Before).mock.calls[0][0].bind(cukeWorld)('world')
        expect(executeHooksWithArgs)
            .toBeCalledWith('beforeScenario', 'beforeScenario', ['world', cukeWorld])
        // @ts-expect-error
        vi.mocked(Cucumber.After).mock.calls[0][0].bind(cukeWorld)('world')
        expect(executeHooksWithArgs)
            .toBeCalledWith('afterScenario', 'afterScenario', ['world', { 'duration': NaN, 'error': undefined, 'passed': false }, cukeWorld])
    })

    it('wrapSteps', async () => {
        const adapter = await CucumberAdapter.init!('0-0', {}, ['/foo/bar'], {}, {})
        adapter.getHookParams = 'getHookParams'
        adapter.wrapStep = vi.fn()

        expect(adapter.wrapStep).toBeCalledTimes(0)
        adapter.wrapSteps()
        expect(Cucumber.setDefinitionFunctionWrapper).toBeCalledTimes(1)
        vi.mocked(Cucumber.setDefinitionFunctionWrapper).mock.calls[0][0](vi.fn())
        expect(adapter.wrapStep).toBeCalledWith(
            expect.any(Function),
            true,
            undefined,
            '0-0',
            { retry: 0 },
            expect.any(Function)
        )
    })

    it('wrapSteps does not wrap wdio hooks', async () => {
        const adapter = await CucumberAdapter.init!('0-0', {}, ['/foo/bar'], {}, {})
        adapter.getHookParams = 'getHookParams'
        adapter.wrapStep = vi.fn()

        expect(adapter.wrapStep).toBeCalledTimes(0)
        adapter.wrapSteps()
        function wdioHookFn () { return 'foobar' }
        expect(Cucumber.setDefinitionFunctionWrapper).toBeCalledTimes(1)
        expect(
            vi.mocked(Cucumber.setDefinitionFunctionWrapper).mock.calls[0][0](wdioHookFn)()
        ).toBe('foobar')
    })

    it('wrapStep', async () => {
        const adapter = await CucumberAdapter.init!('0-0', {}, ['/foo/bar'], {}, {})
        const wrappedStep = adapter.wrapStep('code', true, {}, '0-2', {}, () => 'hookParams')
        expect(testFnWrapper).toBeCalledTimes(0)
        wrappedStep('someWorld', 1, 2, 3)
        expect(vi.mocked(testFnWrapper).mock.calls).toMatchSnapshot()
    })
})
