export default {
    audit: jest.fn().mockReturnValue({
        score: 1,
        numericValue: 24347,
        numericUnit: 'unitless',
        displayValue: '0',
        details: {
            type: 'debugdata',
            items: [
                {
                    finalLayoutShiftTraceEventFound: true,
                },
            ],
        },
    })
}
