import { vi } from 'vitest'
export default {
    audit: vi.fn().mockReturnValue({
        details: {},
        displayValue: 'splash-screen',
        score: 0
    })
}
