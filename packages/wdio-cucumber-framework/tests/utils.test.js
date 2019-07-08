import { createStepArgument, compareScenarioLineWithSourceLine, getStepFromFeature } from '../src/utils'

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
})
