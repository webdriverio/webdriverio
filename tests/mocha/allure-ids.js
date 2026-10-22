import { addAllureId, addArgument, addTestCaseId } from '@wdio/allure-reporter'

describe('Allure test case identity', () => {
    it('excludes parameters from its generated identity', async () => {
        await addArgument('input', browser.capabilities.browserName)
    })

    it('retains its identity with an ALLURE_ID', async () => {
        await addAllureId('1234')
    })

    it('retains an explicit test case ID with an ALLURE_ID', async () => {
        await addTestCaseId('explicit-case-id')
        await addAllureId('5678')
    })

    it('retains its identity when retried', function () {
        this.retries(1)
        if (this.test.currentRetry() === 0) {
            throw new Error('retry the synthetic test once')
        }
    })
})
