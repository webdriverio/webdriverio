import { vi } from 'vitest'
export default {
    audit: vi.fn().mockImplementation((params: any) => {
        if (params.error) {
            throw params.error
        }

        return {
            details: {
                items: [{
                    numRequests: 201,
                    numScripts: 36,
                    numStylesheets: 7,
                    numFonts: 5,
                    numTasks: 110,
                    numTasksOver10ms: 1,
                    numTasksOver25ms: 0,
                    numTasksOver50ms: 0,
                    numTasksOver100ms: 0,
                    numTasksOver500ms: 0,
                    rtt: 19.016000000000002,
                    throughput: 569783.0945443822,
                    maxRtt: 145.65800000000002,
                    maxServerLatency: 4980.4710000000005,
                    totalByteWeight: 3897521,
                    totalTaskTime: 56.882000000000026,
                    mainDocumentTransferSize: 50074
                }]
            }
        }
    })
}
