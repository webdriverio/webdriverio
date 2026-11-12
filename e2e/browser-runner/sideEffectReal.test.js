import { $, expect } from '@wdio/globals'
import './components/SideEffectReal.js'
describe('module side-effect real control', () => {
    it('renders the expected evaluation-time marker in fresh Chrome', async () => {
        document.body.innerHTML = '<wdio-side-effect-real></wdio-side-effect-real>'
        const actual = await $('wdio-side-effect-real').getText()
        expect(actual).toBe('real-module-marker')
    })
})
