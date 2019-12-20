/**
 * This is just an example, test is not running anywhere.
 */

describe('perf', () => {
    before(() => {
        browser.url('http://adam.goucher.ca/parkcalc/')
        $('body').waitForExist()
        browser.pause(2000)
    })

    it('getting $$[idx] performance', () => {
        const elems = browser.$$('*')

        const start = Date.now()
        elems[10].$('not-existing')
        console.log(Date.now() - start)

        // tests on my local machine
        // before:  42150 ms, 2048 calls
        // after:   50 ms, 2 calls
        //
        // Duration decreased by 99.9%
        // (before - after) / after * 100 = 99.88%
    })

    it('getting $ performance', () => {
        const start = Date.now()
        for (let i = 0; i < 100; i++) {
            $('body')
        }
        console.log(Date.now() - start)

        // tests on my local machine
        // before:  1200
        // after:   1100
        //
        // Duration decreased by 8%
        // (before - after) / after * 100 = 8%
    })
})
