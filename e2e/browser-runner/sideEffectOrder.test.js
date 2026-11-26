import { expect } from '@wdio/globals'
import { mock } from '@wdio/browser-runner'
import './components/SideEffectOrderA.js'
import { marker } from './components/SideEffectOrderNamed.js'
import './components/SideEffectOrderB.js'
import './components/SideEffectOrderA.js'

mock('./components/SideEffectValue.js', async () => {
    globalThis.sideEffectOrder = ['factory:start']
    await Promise.resolve()
    globalThis.sideEffectOrder.push('factory:done')
    return { MARKER: 'mocked-order-marker' }
})

describe('module side-effect import order', () => {
    it('awaits factories and preserves mixed import order and single evaluation', () => {
        expect(marker).toBe('mocked-order-marker')
        expect(globalThis.sideEffectOrder).toEqual([
            'factory:start',
            'factory:done',
            'a:mocked-order-marker',
            'named:mocked-order-marker',
            'b:mocked-order-marker'
        ])
    })
})
