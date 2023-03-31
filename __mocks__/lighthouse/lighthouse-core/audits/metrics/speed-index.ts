import { vi } from 'vitest'
export default {
    audit: vi.fn().mockReturnValue({
        score: 1,
        numericValue: 1348.7540095850825,
        numericUnit: 'millisecond',
        displayValue: 'lighthouse-core/lib/i18n/i18n.js | seconds # 3',
    })
}
