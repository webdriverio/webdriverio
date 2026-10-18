import { describe, it, expect } from 'vitest'

import { describeSelector } from '../../src/utils/describeSelector.js'

describe('describeSelector', () => {
    it('keeps a string selector', () => {
        expect(describeSelector({ selector: '#foo' })).toBe('#foo')
    })

    it('keeps the source of a function selector', () => {
        function byScript () { return document.body }
        expect(describeSelector({ selector: byScript })).toBe(byScript.toString())
    })

    it('names the strategy of a custom$ element', () => {
        const selector = { strategy: () => null, strategyName: 'byTestId', strategyArguments: ['menu'] }
        expect(describeSelector({ selector })).toBe('custom$(byTestId)')
    })

    it('names the strategy of an item of a custom$$ list', () => {
        const selector = { strategy: () => [], strategyName: 'items', strategyArguments: [] }
        expect(describeSelector({ selector, index: 2 })).toBe('custom$$(items)')
    })

    it('shows another object selector as JSON', () => {
        expect(describeSelector({ selector: { name: 'hasEntry', args: ['title', 'Item'] } }))
            .toBe('{"name":"hasEntry","args":["title","Item"]}')
        expect(describeSelector({ selector: { 'element-6066-11e4-a52e-4f735466cecf': 'abc' } }))
            .toBe('{"element-6066-11e4-a52e-4f735466cecf":"abc"}')
    })

    it('falls back to String() for an object that is not JSON', () => {
        const selector: Record<string, unknown> = {}
        selector.self = selector
        expect(describeSelector({ selector })).toBe('[object Object]')
    })

    it('shows a missing selector as undefined', () => {
        expect(describeSelector({ selector: undefined })).toBe('undefined')
    })
})
