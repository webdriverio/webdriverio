import { $, expect } from '@wdio/globals'
import { mock } from '@wdio/browser-runner'
import { RegisteredElement } from './components/SideEffectNamed.js'
mock('./components/SideEffectValue.js', () => ({ MARKER: 'mocked-module-marker' }))
describe('module side-effect named control', () => {
    it('renders the expected evaluation-time marker in fresh Chrome', async () => {
        document.body.innerHTML = '<wdio-side-effect-named></wdio-side-effect-named>'
        const actual = await $('wdio-side-effect-named').getText()
        expect(actual).toBe('mocked-module-marker')
        expect(RegisteredElement).toBeDefined()
    })
})
