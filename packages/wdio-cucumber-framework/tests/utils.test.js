import { createStepArgument, compareScenarioLineWithSourceLine, getStepFromFeature, getTestParent, formatMessage, getUniqueIdentifier, getUriOf } from '../src/utils'

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

    it('compareScenarioLineWithSourceLine', () => {
        expect(compareScenarioLineWithSourceLine({
            type: 'ScenarioOutline',
            examples: [{
                tableBody: [
                    { location: { line: 123 } },
                    { location: { line: 321 } }
                ]
            }]
        }, { line: 111 })).toBe(false)
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
        it('should set title for custom type', () => {
            expect(formatMessage({
                type: 'foobar',
                payload: { ctx: { currentTest: { title: 'barfoo' } } }
            })).toMatchSnapshot()
        })

        it('should set type to hook:end', () => {
            expect(formatMessage({
                type: 'foobar',
                payload: {
                    title: '"before all" hook',
                    error: new Error('boom'),
                    state: 'passed'
                }
            }).type).toBe('hook:end')
        })

        it('should set passed state for test hooks', () => {
            expect(formatMessage({
                type: 'afterTest',
                payload: { state: 'passed' }
            })).toMatchSnapshot()
        })

        it('should not fail if payload was not passed', () => {
            expect(formatMessage({ type: 'test' })).toMatchSnapshot()
        })
    })

    it('getUriOf', () => {
        expect(getUriOf()).toBe(undefined)
        expect(getUriOf({})).toBe(undefined)
        expect(getUriOf({ uri: __filename }))
            .toBe('/packages/wdio-cucumber-framework/tests/utils.test.js')
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
})
