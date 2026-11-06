import { $, expect } from '@wdio/globals'
import { mock } from '@wdio/browser-runner'
import './components/SideEffectValue.js'
import { RegisteredElement } from './components/SideEffectNamed.js'

mock('./components/SideEffectValue.js', async (actual) => {
    globalThis.sideEffectActualCalls = (globalThis.sideEffectActualCalls || 0) + 1
    await Promise.resolve()
    return { MARKER: `${actual.MARKER}:mocked` }
})

describe('directly mocked side-effect import with an actual module', () => {
    it('supplies the actual namespace once and exposes the mock to a consumer', async () => {
        document.body.innerHTML = '<wdio-side-effect-named></wdio-side-effect-named>'
        expect(RegisteredElement).toBeDefined()
        expect(await $('wdio-side-effect-named').getText()).toBe('real-module-marker:mocked')
        expect(globalThis.sideEffectActualCalls).toBe(1)
    })
})
