import { filterSpecArgs } from '../src/utils'

describe('utils:filterSpecArgs', () => {
    it('no args', () => {
        expect(filterSpecArgs([])).toHaveLength(0)
    })
    it('only functions', () => {
        expect(filterSpecArgs([() => {}, () => {}])).toHaveLength(0)
    })
    it('not functions', () => {
        expect(filterSpecArgs([1, 'foo', {}, []])).toEqual([1, 'foo', {}, []])
    })
    it('mixed', () => {
        expect(filterSpecArgs([false, () => {}])).toEqual([false])
    })
})
