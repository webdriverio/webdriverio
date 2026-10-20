import { describe, expect, it } from 'vitest'

import { pluginTitle } from '../src/packagesDocs.js'

describe('pluginTitle', () => {
    it('capitalizes every part', () => {
        expect(pluginTitle(['lighthouse'])).toBe('Lighthouse')
        expect(pluginTitle(['shared', 'store'])).toBe('Shared Store')
    })

    it('uses the own spelling of a known word', () => {
        expect(pluginTitle(['ai'])).toBe('AI')
        expect(pluginTitle(['cucumberjs', 'json'])).toBe('CucumberJS JSON')
        expect(pluginTitle(['json'])).toBe('JSON')
    })
})
