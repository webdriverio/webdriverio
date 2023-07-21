import { describe, it, expect } from 'vitest'
import { SevereServiceError } from '../../src/index.js'

describe('SevereServiceError', () => {
    it('should provide unique error name', () => {
        const err = new SevereServiceError()
        expect(err.name).toBe('SevereServiceError')
    })

    it('should provide a default error message', () => {
        const err = new SevereServiceError()
        expect(err.message).toBe('Severe Service Error occurred.')
    })

    it('should accept a custom error message', () => {
        const err = new SevereServiceError('Something happened.')
        expect(err.message).toBe('Something happened.')
    })
})
