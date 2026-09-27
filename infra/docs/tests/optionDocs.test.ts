import { describe, it, expect } from 'vitest'

import { formatOptionDocs } from '../src/optionDocs.js'

describe('formatOptionDocs', () => {
    it('turns a typed heading into an Option component', () => {
        const result = formatOptionDocs('## `timeout` (number, optional)\n\nHow long to wait.\n')
        expect(result).toContain('## `timeout`')
        expect(result).toContain('<Option type="number" required="No">')
        expect(result).toContain('How long to wait.')
        expect(result).toContain('</Option>')
    })
})
