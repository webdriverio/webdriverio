import {
    createStepArgument,
    compareScenarioLineWithSourceLine,
    getTestParent,
    formatMessage,
    getUniqueIdentifier,
    getTestStepTitle,
    buildStepPayload,
    getDataFromResult,
    setUserHookNames,
    getTestCaseSteps,
    enhanceStepWithPickleData,
    getAllSteps
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

    describe('enhanceStepWithPickleData', () => {
        it('should return pickle step text if step was found', () => {
            const pickle = { steps: [{ locations: [{ line: 1 }], text: '11' }, { locations: [{ line: 1 }, { line: 2 }, { line: 3 }], text: '2' }] }
            expect(enhanceStepWithPickleData({ location: { line: 2 } }, pickle)).toEqual({ location: { line: 2 }, text: '2' })
        })

        it('should return step text if step was not found', () => {
            const pickle = { steps: [{ locations: [{ line: 1 }], text: '11' }] }
            expect(enhanceStepWithPickleData({ location: { line: 2 }, text: 'foo' }, pickle)).toEqual({ location: { line: 2 }, text: 'foo' })
        })

        it('should only enhance argument of DataTable type', () => {
            const pickle = { steps: [{
                locations: [{ line: 1 }],
                text: '11',
                arguments: [{ content: 'foobar', location: {} }]
            }] }
            const step = {
                location: { line: 1 },
                argument: { content: 'foobar', location: {}, type: 'DocString' }
            }
            expect(enhanceStepWithPickleData(step, pickle)).toEqual({
                location: { line: 1 },
                text: '11',
                argument: { content: 'foobar', location: {}, type: 'DocString' }
            })
        })

        it('should replace data table variables with values', () => {
            const pickle = { steps: [{
                locations: [{ line: 1 }],
                text: 'bar',
                arguments: [{
                    rows: [{
                        cells: [{
                            location: { line: 11, column: 10 },
                            value: 'winter'
                        }, {
                            location: { line: 11, column: 20 },
                            value: 'cold'
                        }]
                    }]
                }]
            }] }

            const step = {
                location: { line: 1 },
                argument: {
                    type: 'DataTable',
                    rows: [{
                        cells: [{
                            location: { line: 11, column: 10 },
                            value: '<season>'
                        }, {
                            location: { line: 11, column: 20 },
                            value: '<weather>'
                        }]
                    }]
                }
            }
            expect(enhanceStepWithPickleData(step, pickle)).toEqual({
                location: { line: 1 },
                text: 'bar',
                argument: {
                    type: 'DataTable',
                    rows: [{
                        cells: [{
                            location: { line: 11, column: 10 },
                            value: 'winter'
                        }, {
                            location: { line: 11, column: 20 },
                            value: 'cold'
                        }]
                    }]
                }
            })
        })
    })

    describe('getAllSteps', () => {
        it('should add background steps', () => {
            const feature = { children: [{ type: 'Background', steps: [1, 2] }, { type: 'Scenario', steps: [3, 4] }] }
            expect(getAllSteps(feature, { steps: [5, 6] })).toEqual([1, 2, 5, 6])
        })

        it('should be ok with missing background', () => {
            const feature = { children: [{ type: 'Scenario', steps: [3, 4] }] }
            expect(getAllSteps(feature, { steps: [5, 6] })).toEqual([5, 6])
        })
    })

    describe('getTestCaseSteps', () => {
        it('should properly build test case steps array', () => {
            const feature = {
                children: [{
                    type: 'Background', steps: [
                        { type: 'Step', text: 'Given <browser> is opened', location: { line: 21 } }]
                }]
            }

            const scenario = {
                steps: [
                    { type: 'Hook', text: '', location: { uri: 'uri', line: 12 } },
                    { type: 'Step', text: 'Then <user> is logged in', location: { line: 31 } }]
            }

            const pickle = {
                steps: [
                    { locations: [{ line: 21 }], text: 'Given chrome is opened' },
                    { locations: [{ line: 31 }, { line: 42 }], text: 'Then John is logged in' }]
            }

            const testCasePreparedEvent = {
                sourceLocation: { uri: 'feature' }, steps: [
                    { sourceLocation: { uri: 'uri', line: 12 }, actionLocation: { uri: 'uri', line: 12 } }, // wdio hook
                    { sourceLocation: { uri: 'feature', line: 21 }, actionLocation: { uri: 'uri', line: 121 } }, // background step
                    { actionLocation: { uri: 'uri', line: 17 } }, // tagged hook
                    { sourceLocation: { uri: 'feature', line: 31 }, actionLocation: { uri: 'uri', line: 131 } }, // scenario step
                ]
            }

            const steps = getTestCaseSteps(feature, scenario, pickle, testCasePreparedEvent)
            expect(steps).toEqual([{
                type: 'Hook',
                text: '',
                location: {
                    uri: 'uri',
                    line: 12
                }
            }, {
                type: 'Step',
                text: 'Given chrome is opened',
                location: {
                    line: 21
                }
            }, {
                type: 'Hook',
                location: {
                    uri: 'uri',
                    line: 17
                },
                keyword: 'Hook',
                text: ''
            }, {
                type: 'Step',
                text: 'Then John is logged in',
                location: {
                    line: 31
                }
            }])
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
        it('keyword and title are not passed', () => {
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
