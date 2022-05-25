import { vi } from 'vitest'
export default {
    audit: vi.fn().mockReturnValue({
        details: {},
        displayValue: 'apple-touch-icon',
        score: 1
    })
}
