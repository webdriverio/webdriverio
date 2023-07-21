import { vi } from 'vitest'
export default {
    audit: vi.fn().mockReturnValue({
        details: {},
        displayValue: 'viewport',
        score: 1
    })
}
