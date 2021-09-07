import { setOptions } from 'expect-webdriverio'
import { executeHooksWithArgs, testFnWrapper } from '@wdio/utils'
import * as Cucumber from '@cucumber/cucumber'
import mockery from 'mockery'

import CucumberAdapter from '../src'
import { setUserHookNames } from '../src/utils'
import * as packageExports from '../src'

jest.mock('../src/reporter', () => class CucumberReporter {
    eventListener = {
        getPickleIds: jest.fn().mockReturnValue(['8']),
        getHookParams: jest.fn().mockReturnValue({ uri: 'uri', feature: 'feature', scenario: 'scenario', step: 'step', result: { 'duration': undefined, 'error': undefined, 'passed': false } })
    }
})

jest.mock('../src/utils', () => ({
    setUserHookNames: jest.fn()
}))

jest.mock('@cucumber/gherkin-streams', () => ({
    GherkinStreams: { fromPaths: jest.fn().mockReturnValue('GherkinStreams.fromPaths') }
}))

declare global {
    var MODULE_A_WAS_LOADED: boolean
    var MODULE_B_WAS_LOADED_WITH: any
    var MODULE_INLINE_WAS_LOADED: boolean
    var MODULE_C_WAS_LOADED: boolean
}

describe('CucumberAdapter', () => {
    beforeEach(() => {
        (Cucumber.PickleFilter as jest.Mock).mockClear()
        ;(executeHooksWithArgs as jest.Mock).mockClear()
        ;(Cucumber.Runtime as jest.Mock).mockClear()
        ;(Cucumber.setDefinitionFunctionWrapper as jest.Mock).mockClear()
        ;(mockery.enable as jest.Mock).mockClear()
        ;(mockery.registerMock as jest.Mock).mockClear()
        ;(mockery.disable as jest.Mock).mockClear()
        ;(Cucumber.BeforeAll as jest.Mock).mockClear()
        ;(Cucumber.AfterAll as jest.Mock).mockClear()
        ;(Cucumber.Before as jest.Mock).mockClear()
        ;(Cucumber.After as jest.Mock).mockClear()
        ;(Cucumber.BeforeStep as jest.Mock).mockClear()
        ;(Cucumber.AfterStep as jest.Mock).mockClear()
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
    })

    it('can be initiated with tests', async () => {
        const adapter = await CucumberAdapter.init('0-0', {
            waitforTimeout: 1,
            waitforInterval: 2
        }, ['/foo/bar'], {}, {})

        expect(executeHooksWithArgs).toBeCalledTimes(0)
        expect(setOptions).toBeCalledWith({
            wait: 1,
            interval: 2
        })
        expect(adapter.hasTests()).toBe(true)
        expect(Cucumber.PickleFilter).toBeCalledWith({
            cwd: expect.any(String),
            featurePaths: ['/foo/bar'],
            names: [],
            tagExpression: ''
        })
    })

    it('should trigger after hook if initiation fails', async () => {
        (Cucumber.parseGherkinMessageStream as jest.Mock)
            .mockRejectedValueOnce(new Error('boom'))

        const err = await CucumberAdapter.init('0-0', {
            cucumberFeaturesWithLineNumbers: ['/bar/foo', '/foo/bar']
        }, ['/foo/bar'], {}, {})
            .catch((err) => err)
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
        const adapter = await CucumberAdapter.init('0-0', {}, ['/foo/bar'], {}, {})
        adapter.registerRequiredModules = jest.fn()
        adapter.addWdioHooks = jest.fn()
        adapter.loadSpecFiles = jest.fn()

        const result = await adapter.run()
        expect(result).toBe(0)

        expect(adapter.registerRequiredModules).toBeCalledTimes(1)
        expect(adapter.addWdioHooks).toBeCalledTimes(1)
        expect(adapter.loadSpecFiles).toBeCalledTimes(1)
        expect(setUserHookNames).toBeCalledTimes(1)
    })

    it('can run with failing result', async () => {
        const adapter = await CucumberAdapter.init('0-0', {
            cucumberOpts: { shouldFail: 123 }
        }, ['/foo/bar'], {}, {})
        const result = await adapter.run()
        expect(result).toBe(1)
        expect(executeHooksWithArgs).toBeCalledTimes(1)
    })

    it('can take cucumber report failure count', async () => {
        const adapter = await CucumberAdapter.init('0-0', {
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
        const adapter = await CucumberAdapter.init('0-0', {
            cucumberOpts: { shouldThrow: 'some error' }
        }, ['/foo/bar'], {}, {})
        const err = await adapter.run().catch(err => err)
        expect(err.message).toBe('some error')
    })

    it('registerRequiredModules', async () => {
        const adapter = await CucumberAdapter.init('0-0', {
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

    it('requiredFiles', async () => {
        const adapter = await CucumberAdapter.init('0-0', {
            cucumberOpts: {
                require: [
                    __dirname + '/' + __filename,
                    __dirname + '/__mocks__/module*.ts'
                ]
            }
        }, ['/foo/bar'], {}, {})
        expect(adapter.requiredFiles()).toHaveLength(4)
    })

    it('loadSpecFiles', async () => {
        const adapter = await CucumberAdapter.init('0-0', {}, ['/foo/bar'], {}, {})
        adapter.requiredFiles = jest.fn().mockReturnValue([__dirname + '/__mocks__/moduleC.ts'])

        expect(global.MODULE_C_WAS_LOADED).toBe(undefined)
        adapter.loadSpecFiles()
        expect(global.MODULE_C_WAS_LOADED).toBe(true)

        expect(mockery.enable).toBeCalledTimes(1)
        expect(mockery.registerMock).toBeCalledWith('@cucumber/cucumber', expect.any(Object))
        expect(mockery.disable).toBeCalledTimes(1)
    })

    it('addWdioHooks', async () => {
        const adapter = await CucumberAdapter.init('0-0', {}, ['/foo/bar'], {}, {})
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

        ;(Cucumber.AfterStep as jest.Mock).mock.calls[0][0]('world')
        expect(executeHooksWithArgs)
            .toBeCalledWith('afterStep', 'afterStep', ['step', 'scenario', { 'duration': NaN, 'error': undefined, 'passed': false }])
        ;(Cucumber.BeforeStep as jest.Mock).mock.calls[0][0]()
        expect(executeHooksWithArgs)
            .toBeCalledWith('beforeStep', 'beforeStep', ['step', 'scenario'])
        ;(Cucumber.BeforeAll as jest.Mock).mock.calls[0][0]()
        expect(executeHooksWithArgs)
            .toBeCalledWith('beforeFeature', 'beforeFeature', ['uri', 'feature'])
        ;(Cucumber.AfterAll as jest.Mock).mock.calls[0][0]()
        expect(executeHooksWithArgs)
            .toBeCalledWith('afterFeature', 'afterFeature', ['uri', 'feature'])
        ;(Cucumber.Before as jest.Mock).mock.calls[0][0]('world')
        expect(executeHooksWithArgs)
            .toBeCalledWith('beforeScenario', 'beforeScenario', ['world'])
        ;(Cucumber.After as jest.Mock).mock.calls[0][0]('world')
        expect(executeHooksWithArgs)
            .toBeCalledWith('afterScenario', 'afterScenario', ['world', { 'duration': NaN, 'error': undefined, 'passed': false }])
    })

    it('wrapSteps', async () => {
        const adapter = await CucumberAdapter.init('0-0', {}, ['/foo/bar'], {}, {})
        adapter.getHookParams = 'getHookParams'
        adapter.wrapStep = jest.fn()

        expect(adapter.wrapStep).toBeCalledTimes(0)
        adapter.wrapSteps()
        expect(Cucumber.setDefinitionFunctionWrapper).toBeCalledTimes(1)
        ;(Cucumber.setDefinitionFunctionWrapper as jest.Mock).mock.calls[0][0](jest.fn())
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
        const adapter = await CucumberAdapter.init('0-0', {}, ['/foo/bar'], {}, {})
        adapter.getHookParams = 'getHookParams'
        adapter.wrapStep = jest.fn()

        expect(adapter.wrapStep).toBeCalledTimes(0)
        adapter.wrapSteps()
        function wdioHookFn () { return 'foobar' }
        expect(Cucumber.setDefinitionFunctionWrapper).toBeCalledTimes(1)
        expect(
            (Cucumber.setDefinitionFunctionWrapper as jest.Mock).mock.calls[0][0](wdioHookFn)()
        ).toBe('foobar')
    })

    it('wrapStep', async () => {
        const adapter = await CucumberAdapter.init('0-0', {}, ['/foo/bar'], {}, {})
        const wrappedStep = adapter.wrapStep('code', true, {}, '0-2', {}, () => 'hookParams')
        expect(testFnWrapper).toBeCalledTimes(0)
        wrappedStep('someWorld', 1, 2, 3)
        expect((testFnWrapper as jest.Mock).mock.calls).toMatchSnapshot()
    })
})
