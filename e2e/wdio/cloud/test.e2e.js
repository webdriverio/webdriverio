import logger from '@wdio/logger'
const log = logger('test.e2e')

describe('this browser session', () => {
    it('should run in SL', () => {
        log.warn(`browser.options.hostname: ${browser.options.hostname}`)
        expect(browser.options.hostname).toContain('saucelabs.com')
    })
})
