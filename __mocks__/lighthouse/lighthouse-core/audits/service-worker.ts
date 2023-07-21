import { vi } from 'vitest'
export default {
    audit: vi.fn().mockReturnValue({
        details: {},
        displayValue: 'service-worker',
        score: 1
    })
}
