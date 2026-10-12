import { ReportEvents } from '@wdio/html-reporter'

describe('html reporter', () => {
    it('reports a passing test with a log line', async () => {
        new ReportEvents().logMessage('a message from the test')
        await expect(browser).toHaveTitle('Mock Page Title')
    })
})
