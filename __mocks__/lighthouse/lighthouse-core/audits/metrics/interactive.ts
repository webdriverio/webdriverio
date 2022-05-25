import { vi } from 'vitest'
export default {
    audit: vi.fn().mockReturnValue({
        score: 0.91,
        numericValue: 3683.55125,
        numericUnit: 'millisecond',
        displayValue: 'lighthouse-core/lib/i18n/i18n.js | seconds # 5',
        extendedInfo: {
            value: {
                timeInMs: 3683.55125,
                timestamp: undefined,
                optimistic: 3409.6876,
                pessimistic: 3957.4148999999998,
            },
        },
    })
}
