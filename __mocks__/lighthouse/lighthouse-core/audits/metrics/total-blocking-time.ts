import { vi } from 'vitest'
export default {
    audit: vi.fn().mockReturnValue({
        score: 0.27,
        numericValue: 855.9374500000001,
        numericUnit: 'millisecond',
        displayValue: 'lighthouse-core/lib/i18n/i18n.js | ms # 1',
    })
}
