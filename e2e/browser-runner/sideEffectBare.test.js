import { $, expect } from '@wdio/globals'
import { mock } from '@wdio/browser-runner'
import './components/SideEffectBare.js'
mock('./components/SideEffectValue.js', () => ({ MARKER: 'mocked-module-marker' }))
describe('module side-effect bare control', () => {
    it('renders the expected evaluation-time marker in fresh Chrome', async () => {
        document.body.innerHTML = '<wdio-side-effect-bare></wdio-side-effect-bare>'
        const actual = await $('wdio-side-effect-bare').getText()
        expect(actual).toBe('mocked-module-marker')
    })
})
