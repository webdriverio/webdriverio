import { $, expect } from '@wdio/globals'
import { mock } from '@wdio/browser-runner'
import './components/SideEffectValue.js'
import { RegisteredElement } from './components/SideEffectNamed.js'

mock('./components/SideEffectValue.js', () => {
    globalThis.sideEffectZeroCalls = (globalThis.sideEffectZeroCalls || 0) + 1
    return { MARKER: 'zero-argument-mocked-marker' }
})

describe('directly mocked side-effect import without an actual argument', () => {
    it('executes the factory once without requiring an import binding', async () => {
        document.body.innerHTML = '<wdio-side-effect-named></wdio-side-effect-named>'
        expect(RegisteredElement).toBeDefined()
        expect(await $('wdio-side-effect-named').getText()).toBe('zero-argument-mocked-marker')
        expect(globalThis.sideEffectZeroCalls).toBe(1)
    })
})
