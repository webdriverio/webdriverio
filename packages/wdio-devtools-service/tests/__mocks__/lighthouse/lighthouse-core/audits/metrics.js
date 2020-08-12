export default {
    audit: jest.fn().mockReturnValue({
        details: {
            items: [
                {
                    estimatedInputLatency: 16,
                    domContentLoaded: 20608,
                    firstVisualChange: 18114,
                    firstPaint: 18090,
                    firstContentfulPaint: 18090,
                    firstMeaningfulPaint: 23117,
                    largestContentfulPaint: 23117,
                    lastVisualChange: 24347,
                    firstCPUIdle: 23117,
                    interactive: 24117,
                    load: 54730,
                    speedIndex: 20411,
                    totalBlockingTime: 20411,
                    cumulativeLayoutShift: 24347,
                },
            ],
        },
    }),
}
