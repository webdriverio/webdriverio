import path from 'path'
import { CucumberAdapter } from '../src'

const conf = {
    cucumberOpts: {
        timeout: 15000,
        require: [path.join(__dirname, '/fixtures/retry-step-definition.js')]
    }
}
const feature = [path.join(__dirname, '/fixtures/retry.feature')]

const NOOP = () => {}

global.browser = {
    config: {},
    options: {},
    capabilities: {
        device: '',
        os: 'OS X',
        os_version: 'Sierra',
        browserName: 'chrome'
    },
    /**
     * task of this command is to add 1 so we can have a simple demo test like
     * browser.command(1).should.be.equal(2)
     */
    url: () => new Promise((resolve) => {
        setTimeout(() => resolve('url'), 1000)
    }),
    click: () => new Promise((resolve) => {
        setTimeout(() => resolve('click'), 1000)
    }),
    getTitle: (ms = 500) => new Promise((resolve) => {
        setTimeout(() => resolve('Google'), 1000)
    }),
    pause: (ms = 500) => new Promise((resolve) => {
        setTimeout(() => resolve('pause'), 1000)
    })
}

process.send = NOOP

let timeToExecute
describe('retryTest', () => {
    describe('can retry failed step definitions', () => {
        let start
        beforeAll(async () => {
            const adapter = new CucumberAdapter(0, conf, feature, {})

            start = new Date().getTime()
            await expect(adapter.run()).resolves.toEqual(0)
        })

        it('should take the expected amount of time to execute suite', () => {
            timeToExecute = new Date().getTime() - start
            expect(timeToExecute).toBeGreaterThan(10000)
        })
    })
})
