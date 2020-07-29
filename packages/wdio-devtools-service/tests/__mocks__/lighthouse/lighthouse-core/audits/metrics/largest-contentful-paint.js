export default {
    audit: jest.fn().mockReturnValue({
        score: 0.99,
        numericValue: 1785.7373000000002,
        numericUnit: 'millisecond',
        displayValue: 'lighthouse-core/lib/i18n/i18n.js | seconds # 1',
    })
}
