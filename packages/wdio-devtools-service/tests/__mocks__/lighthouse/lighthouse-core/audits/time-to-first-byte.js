export default {
    audit: jest.fn().mockReturnValue({
        details: {
            headings: [],
            items: [],
            overallSavingsMs: -27.904999999999973,
            type: 'opportunity',
        },
        displayValue: 'lighthouse-core/audits/time-to-first-byte.js | displayValue # 0',
        extendedInfo: {
            value: {
                wastedMs: -27.904999999999973
            }
        },
        numericValue: 105.095,
        score: 1,
    })
}
