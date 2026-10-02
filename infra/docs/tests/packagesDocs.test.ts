import { describe, expect, it } from 'vitest'

import { pluginTitle } from '../src/packagesDocs.js'

describe('pluginTitle', () => {
    it('capitalizes every part and writes acronyms in capitals', () => {
        expect(pluginTitle(['lighthouse'])).toBe('Lighthouse')
        expect(pluginTitle(['shared', 'store'])).toBe('Shared Store')
        expect(pluginTitle(['ai'])).toBe('AI')
    })
})
