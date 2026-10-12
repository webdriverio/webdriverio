import { ReportEvents } from '@wdio/html-reporter'

describe('html reporter', () => {
    it('reports a passing test with a log line', async () => {
        new ReportEvents().logMessage('a message from the test')
        new ReportEvents().logMessage({ logged: 'as an object' })
        await expect(browser).toHaveTitle('Mock Page Title')
    })
})
