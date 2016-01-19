import conf from '../../conf/index.js'

/**
 * stale element retry is not working in standalone mode
 */
describe.skip('staleElementRetry', () => {
    describe('basic command', () => {
        it('does not throw staleElementReference exception when getting visibility of elements rapidly removed from DOM', async function () {
            let iterations = 100
            await this.client.url(conf.testPage.staleTest)
            while (iterations--) {
                let res = await this.client.isVisible('.staleElementContainer1 .stale-element-container-row')
                console.log(`staleElementRetry loop cnt: ${iterations}, command result: ${res}`)
                expect(res).to.be.true
            }
        })
    })

    describe('custom command', () => {
        before(async function() {
            await this.client.url(conf.testPage.staleTest)
        })

        it('does not throw staleElementReference exception when waiting for element to become invisible but which is removed from DOM in a custom command', async function () {
            this.client.addCommand('waitForVisibleInParallel', async () => {
                const promises = []
                for (let i = 1; i <= 8; i++) {
                    promises.push(this.client.waitForVisible('.staleElementContainer2 .stale-element-container-row-' + i, 10000, true))
                }

                return Promise.all(promises)
                .then(function (results) {
                    results.map(function (result) {
                        result.should.be.true
                    })
                })
            })

            await this.client.waitForVisibleInParallel()
        })
    })
})
