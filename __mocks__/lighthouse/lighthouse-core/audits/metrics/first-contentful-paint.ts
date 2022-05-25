import { vi } from 'vitest'
export default {
    audit: vi.fn().mockReturnValue({
        score: 1,
        numericValue: 1006.5961000000002,
        numericUnit: 'millisecond',
        displayValue: 'lighthouse-core/lib/i18n/i18n.js | seconds # 0',
    })
}
