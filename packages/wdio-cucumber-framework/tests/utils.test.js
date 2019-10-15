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
            expect(getStepFromFeature({ children: [{ type: 'Foo', steps: [{ type: 'Bar' }] }] }, null, 0))
                .toEqual({ type: 'Bar' })
        })

        it('should move wdioHookBeforeScenario to the beginning', () => {
            const scenario1Line = 21
            const wdioHookBeforeScenario = {
                'type': 'Hook',
                'location': {
                    'uri': 'node_modules/@wdio/cucumber-framework/build/index.js',
                    line: 141
                },
            }
            const wdioHookAfterScenario = {
                'type': 'Hook',
                'location': {
                    'uri': 'node_modules/@wdio/cucumber-framework/build/index.js',
                    line: 151
                },
            }
            const userBeforeHook = {
                'type': 'Hook',
                'location': {
                    'uri': 'test/step-definitions/given.ts',
                    line: 1
                },
            }
            const userAfterHook = {
                'type': 'Hook',
                'location': {
                    'uri': 'test/step-definitions/given.ts',
                    line: 2
                },
            }
            const pickle = {
                steps: [
                    {
                        'type': 'Step',
                        text: 'step12',
                        'locations': [{ line: 12 }],
                    },
                    {
                        'type': 'Step',
                        text: 'step13',
                        'locations': [{ line: 13 }],
                    },
                    {
                        'type': 'Step',
                        text: 'step22',
                        'locations': [{ line: 22 }],
                    },
                    {
                        'type': 'Step',
                        text: 'step23',
                        'locations': [{ line: 23 }],
                    },
                ]
            }
            const children = [
                {
                    'type': 'Background',
                    'location': { line: 11 },
                    'steps': [
                        {
                            'type': 'Step',
                            'location': { line: 12 },
                        },
                        {
                            'type': 'Step',
                            'location': { line: 13 },
                        }
                    ]
                },
                {
                    'type': 'Scenario',
                    'location': { line: scenario1Line },
                    'steps': [
                        wdioHookBeforeScenario,
                        userBeforeHook,
                        {
                            'type': 'Step',
                            'location': { line: 22 },
                        },
                        {
                            'type': 'Step',
                            'location': { line: 23 },
                        },
                        userAfterHook,
                        wdioHookAfterScenario
                    ]
                },
                {
                    'type': 'Scenario',
                    'location': { line: 31 },
                    'steps': [
                        {
                            'type': 'Step',
                            'location': { line: 32 },
                        }
                    ]
                }
            ]

            const steps = pickle.steps.map(step => ({ type: step.type, text: step.text, location: step.locations[0] }))
            const expectedResult = [
                wdioHookBeforeScenario,
                userBeforeHook,
                steps[0],
                steps[1],
                steps[2],
                steps[3],
                userAfterHook,
                wdioHookAfterScenario
            ]
            const combinedSteps = [...Array(expectedResult.length).keys()].map((_, idx) => getStepFromFeature({ children }, pickle, idx, { line: scenario1Line }))

            expect(combinedSteps).toEqual(expectedResult)
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
                name: '<someval2> here',
                examples: [{
                    tableHeader: {
                        cells: [
                            { value: 'valsome1' },
                            { value: 'someval1' }
                        ]
                    },
                    tableBody: [{
                        location: { line: 54 }
                    }, {
                        location: { line: 123 },
                        cells: [{}, { value: 'realval1' }]
                    }]
                }, {
                    tableHeader: {
                        cells: [
                            { value: 'valsome2' },
                            { value: 'someval2' }
                        ]
                    },
                    tableBody: [{
                        location: { line: 64 }
                    }, {
                        location: { line: 234 },
                        cells: [{}, { value: 'realval2' }]
                    }]
                }]
            }, { line: 234 })).toBe('realval2 here234')
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
})
