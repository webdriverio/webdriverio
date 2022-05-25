import { vi } from 'vitest'
export default {
    audit: vi.fn().mockReturnValue({
        details: {
            headings: [],
            items: [],
            overallSavingsMs: -27.904999999999973,
            type: 'opportunity',
        },
        displayValue: 'lighthouse-core/audits/server-response-time.js | displayValue # 0',
        numericValue: 105.095,
        score: 1,
    })
}
