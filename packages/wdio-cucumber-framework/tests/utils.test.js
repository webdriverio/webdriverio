import { createStepArgument } from '../src/utils'

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
            expect(createStepArgument({
                argument: {
                    type: 'DataTable',
                    rows: [
                        { cells: [{ value: 1 }, { value: 2 }] },
                        { cells: [{ value: 3 }, { value: 4 }] },
                        { cells: [{ value: 5 }, { value: 6 }] }
                    ]
                }
            })).toEqual([{
                rows: [{
                    cells: [1, 2]
                }, {
                    cells: [3, 4]
                }, {
                    cells: [5, 6]
                }]
            }])
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
})
