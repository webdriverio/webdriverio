import { executeHooksWithArgs } from '@wdio/config'

import {
    createStepArgument,
    compareScenarioLineWithSourceLine,
    getStepFromFeature,
    getTestParent,
    formatMessage,
    getUniqueIdentifier,
    getTestStepTitle,
    buildStepPayload,
    getDataFromResult,
    setUserHookNames,
    wrapWithHooks,
    notifyStepHookError
} from '../src/utils'

describe('utils', () => {
    describe('createStepArgument', () => {
        it('Works without argument', () => {
            expect(typeof createStepArgument({})).toBe('undefined')
        })

        it('Works with unexpected type', () => {
            expect(typeof createStepArgument({ argument: { type: 'smth' } }))
                .toBe('undefined')
        })

        it('Works with DataTable', () => {
            const location = { line: 21, column: 11 }
            expect(createStepArgument({
                argument: {
                    type: 'DataTable',
                    rows: [
                        { cells: [{ value: 1, location }, { value: 2, location }] },
                        { cells: [{ value: 3, location }, { value: 4, location }] },
                        { cells: [{ value: 5, location }, { value: 6, location }] }
                    ]
                }
            })).toMatchSnapshot()
        })

        it('Works with DocString', () => {
            expect(createStepArgument({
                argument: {
                    type: 'DocString',
                    content: 'some string content'
                }
            })).toEqual('some string content')
        })
    })

    describe('compareScenarioLineWithSourceLine', () => {
        it('should return false if line not found', () => {
            expect(compareScenarioLineWithSourceLine({
                type: 'ScenarioOutline',
                examples: [{
                    tableBody: [
                        { location: { line: 123 } },
                        { location: { line: 321 } }
                    ]
                }]
            }, { line: 111 })).toBe(false)
        })

        it('should return true if line found', () => {
            expect(compareScenarioLineWithSourceLine({
                type: 'ScenarioOutline',
                examples: [{
                    tableBody: [
                        { location: { line: 123 } },
                        { location: { line: 321 } }
                    ]
                }]
            }, { line: 321 })).toBe(true)
        })

        it('should return true if line found in one of examples', () => {
            expect(compareScenarioLineWithSourceLine({
                type: 'ScenarioOutline',
                examples: [{
                    tableBody: [
                        { location: { line: 123 } },
                        { location: { line: 234 } }
                    ]
                }, {
                    tableBody: [
                        { location: { line: 345 } },
                        { location: { line: 456 } }
                    ]
                }]
            }, { line: 345 })).toBe(true)
        })
    })

    describe('getStepFromFeature', () => {
        it('should be ok if targetStep.type is not Step', () => {
            getStepFromFeature({ children: [{ type: 'Foo', steps: [{ type: 'Bar' }] }] }, null, 0)
        })
    })

    describe('getTestParent', () => {
        it('no feature and not scenario', () => {
            expect(getTestParent({}, {})).toEqual('Undefined Feature: Undefined Scenario')
        })
    })

    describe('formatMessage', () => {
        it('should set passed state for test hooks', () => {
            expect(formatMessage({
                payload: { state: 'passed' }
            })).toMatchSnapshot()
        })

        it('should not fail if payload was not passed', () => {
            expect(formatMessage({})).toEqual({})
        })

        it('should set fullTitle', () => {
            expect(formatMessage({
                payload: { parent: 'foo', title: 'bar' }
            })).toEqual({
                parent: 'foo',
                title: 'bar',
                fullTitle: 'foo: bar',
            })
        })
    })

    describe('getUniqueIdentifier', () => {
        it('Hook', () => {
            expect(getUniqueIdentifier({
                type: 'Hook',
                location: {
                    uri: __filename,
                    line: 54
                }
            })).toBe('utils.test.js54')
        })

        it('ScenarioOutline with text', () => {
            expect(getUniqueIdentifier({
                type: 'ScenarioOutline',
                text: 'no-name'
            }, {})).toBe('no-name')
        })

        it('ScenarioOutline with <>', () => {
            expect(getUniqueIdentifier({
                type: 'ScenarioOutline',
                name: '<someval> here',
                examples: [{
                    tableHeader: {
                        cells: [
                            { value: 'valsome' },
                            { value: 'someval' }
                        ]
                    },
                    tableBody: [{
                        location: { line: 54 }
                    }, {
                        location: { line: 123 },
                        cells: [{}, { value: 'realval' }]
                    }]
                }]
            }, { line: 123 })).toBe('realval here123')
        })
    })

    describe('getTestStepTitle', () => {
        it('keword and title are not passed', () => {
            expect(getTestStepTitle()).toEqual('Undefined Step')
        })
        it('should not add undefined step for hooks', () => {
            expect(getTestStepTitle('Some Hook ', '', 'hook')).toEqual('Some Hook')
        })
    })

    describe('buildStepPayload', () => {
        it('params not passed', () => {
            expect(buildStepPayload('uri', {}, {}, { keyword: 'Foo', location: 'bar' })).toEqual({
                file: 'uri',
                keyword: 'Foo',
                parent: 'Undefined Feature: Undefined Scenario',
                title: 'Foo Undefined Step',
                uid: 'undefined',
            })
        })
    })

    describe('getDataFromResult', () => {
        it('should return proper object', () => {
            expect(getDataFromResult([{ uri: 'uri' }, { feature: 'foo' }, { pickle: 'foo' }, { pickle: 'bar' }])).toEqual({
                uri: 'uri',
                feature: { feature: 'foo' },
                scenarios: [{ pickle: 'foo' }, { pickle: 'bar' }]
            })
        })
    })

    describe('setUserHookNames', () => {
        it('should change function names of user defined hooks', () => {
            const options = {
                beforeTestRunHookDefinitions: [{ code: function wdioHookFoo () { } }, { code: async function someHookFoo () { } }, { code: () => { } }],
                beforeTestCaseHookDefinitions: [{ code: function wdioHookFoo () { } }, { code: function someHookFoo () { } }, { code: async () => { } }],
                afterTestCaseHookDefinitions: [{ code: function wdioHookFoo () { } }, { code: function someHookFoo () { } }, { code: async () => { } }],
                afterTestRunHookDefinitions: [{ code: function wdioHookFoo () { } }, { code: async function someHookFoo () { } }, { code: () => { } }],
            }
            setUserHookNames(options)
            const hookTypes = Object.values(options)
            expect(hookTypes).toHaveLength(4)
            hookTypes.forEach(hookType => {
                expect(hookType).toHaveLength(3)

                const wdioHooks = hookType.filter(hookDefinition => hookDefinition.code.name.startsWith('wdioHook'))
                const userHooks = hookType.filter(hookDefinition => hookDefinition.code.name === 'userHookFn')
                const userAsyncHooks = hookType.filter(hookDefinition => hookDefinition.code.name === 'userHookAsyncFn')
                expect(wdioHooks).toHaveLength(1)
                expect(userHooks).toHaveLength(1)
                expect(userAsyncHooks).toHaveLength(1)
            })
        })
    })

    describe('wrapStepWithHooks', () => {
        it('should wrap step with before/after hooks and return result', async () => {
            global.wrapStepWithHooksCounter = 0
            global.result = [{ uri: 'uri' }, 'feature', 'scenario1', 'scenario2']
            executeHooksWithArgs.mockImplementation(() => new Promise(resolve => setTimeout(() => {
                global.wrapStepWithHooksCounter++
                resolve()
            }, 20)))
            const code = jest.fn().mockImplementation((...args) => {
                global.wrapStepWithHooksCounter++
                return [...args, global.wrapStepWithHooksCounter]
            })
            const { beforeStep, afterStep } = {
                beforeStep: jest.fn(),
                afterStep: jest.fn()
            }
            const wrappedFn = wrapWithHooks(false, code, beforeStep, afterStep)
            const result = await wrappedFn('foo', 'bar')

            expect(global.wrapStepWithHooksCounter).toEqual(3)
            expect(executeHooksWithArgs.mock.calls[0]).toEqual([beforeStep, ['uri', 'feature']])
            expect(executeHooksWithArgs.mock.calls[1]).toEqual([afterStep, ['uri', 'feature', { result: ['foo', 'bar', 2], error: undefined }]])
            expect(result).toEqual(['foo', 'bar', 2])
        })

        it('should wrap step with before/after hooks and throw error', async () => {
            global.result = [{ uri: 'uri' }, 'feature', 'scenario1', 'scenario2']
            const code = jest.fn().mockImplementation((...args) => { throw new Error(args.join(', ')) })
            const { beforeStep, afterStep } = {
                beforeStep: jest.fn(),
                afterStep: jest.fn()
            }
            const wrappedFn = wrapWithHooks(true, code, beforeStep, afterStep )
            let error
            try {
                await wrappedFn('foo', 'bar')
            } catch (err) {
                error = err
            }

            expect(executeHooksWithArgs.mock.calls[0]).toEqual([beforeStep, ['uri', 'feature']])
            expect(executeHooksWithArgs.mock.calls[1]).toEqual([afterStep, ['uri', 'feature', { result: undefined, error: expect.objectContaining({ message: 'foo, bar' }) }]])
            expect(error.message).toBe('foo, bar')
        })
        afterEach(() => {
            delete global.wrapStepWithHooksCounter
            delete global.result
            executeHooksWithArgs.mockClear()
            executeHooksWithArgs.mockReset()
        })
    })

    describe('notifyStepHookError', () => {
        it('should send message if there is Error in results', () => {
            const pSend = jest.spyOn(process, 'send')
            notifyStepHookError('BeforeStep', [undefined, true, new Error('foobar')], '0-1')
            expect(pSend).toBeCalledTimes(1)
            expect(pSend).toBeCalledWith({
                name: 'printFailureMessage',
                origin: 'reporter',
                content: {
                    cid: '0-1',
                    fullTitle: 'BeforeStep Hook',
                    state: 'fail',
                    type: 'hook',
                    error: expect.objectContaining({ name: 'Error', message: 'foobar' }),
                },
            })
        })
    })
})
