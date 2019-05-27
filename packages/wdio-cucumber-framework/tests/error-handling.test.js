import path from 'path'
import { CucumberAdapter } from '../src'

const specs = [path.join(__dirname, '/fixtures/sample.feature')]

const NOOP = () => {}

process.send = NOOP

// what are '/fixtures/async-step-definitions.js' and '/fixtures/async-step-definitions.js'
describe.skip('ignores service hook errors', () => {
    beforeEach( () => {
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
                setTimeout(() => resolve(), 2000)
            }),
            click: () => new Promise((resolve) => {
                setTimeout(() => resolve(), 2000)
            }),
            getTitle: (ms = 500) => new Promise((resolve) => {
                setTimeout(() => resolve('Google'), ms)
            }),
            pause: (ms = 500) => new Promise((resolve) => {
                setTimeout(() => resolve(), ms)
            })
        }
    })

    it('should ignore directly thrown errors (sync mode)', async () => {
        const adapter = new CucumberAdapter('0a', {
            cucumberOpts: {
                timeout: 5000,
                require: [path.join(__dirname, '/fixtures/sync-async-step-definition.js')],
                compiler: ['js:@babel/register']
            },
            beforeFeature: () => { throw new Error('beforeFeature failed') },
            beforeScenario: () => { throw new Error('beforeScenario failed') },
            beforeStep: () => { throw new Error('beforeStep failed') },
            beforeCommand: () => { throw new Error('beforeCommand failed') },
            afterCommand: () => { throw new Error('afterCommand failed') },
            afterStep: () => { throw new Error('afterStep failed') },
            afterScenario: () => { throw new Error('afterScenario failed') },
            afterFeature: () => { throw new Error('afterFeature failed') }
        }, specs, {})
        await expect(adapter.run()).resolves.toEqual(0)
    })

    it('should ignore rejected promises (sync mode)', async () => {
        const adapter = new CucumberAdapter('0a', {
            cucumberOpts: {
                timeout: 5000,
                require: [path.join(__dirname, '/fixtures/sync-async-step-definition.js')],
                compiler: ['js:@babel/register']
            },
            beforeFeature: () => Promise.reject(new Error('beforeFeature failed')),
            beforeScenario: () => Promise.reject(new Error('beforeScenario failed')),
            beforeStep: () => Promise.reject(new Error('beforeStep failed')),
            beforeCommand: () => Promise.reject(new Error('beforeCommand failed')),
            afterCommand: () => Promise.reject(new Error('afterCommand failed')),
            afterStep: () => Promise.reject(new Error('afterStep failed')),
            afterScenario: () => Promise.reject(new Error('afterScenario failed')),
            afterFeature: () => Promise.reject(new Error('afterFeature failed'))
        }, specs, {})
        await expect(adapter.run()).resolves.toEqual(0)
    })

    it('should ignore directly thrown errors (async mode)', async () => {
        global.browser.options = { sync: false }
        const adapter = new CucumberAdapter('0a', {
            cucumberOpts: {
                timeout: 5000,
                require: [path.join(__dirname, '/fixtures/async-step-definitions.js')]
            },
            beforeFeature: () => { throw new Error('beforeFeature failed') },
            beforeScenario: () => { throw new Error('beforeScenario failed') },
            beforeStep: () => { throw new Error('beforeStep failed') },
            beforeCommand: () => { throw new Error('beforeCommand failed') },
            afterCommand: () => { throw new Error('afterCommand failed') },
            afterStep: () => { throw new Error('afterStep failed') },
            afterScenario: () => { throw new Error('afterScenario failed') },
            afterFeature: () => { throw new Error('afterFeature failed') }
        }, specs, {})
        await expect(adapter.run()).resolves.toEqual(0)
    })

    it('should ignore rejected promises (async mode)', async () => {
        global.browser.options = { sync: false }
        const adapter = new CucumberAdapter('0a', {
            cucumberOpts: {
                timeout: 5000,
                require: [path.join(__dirname, '/fixtures/async-step-definitions.js')],
                compiler: ['js:@babel/register']
            },
            beforeFeature: () => Promise.reject(new Error('beforeFeature failed')),
            beforeScenario: () => Promise.reject(new Error('beforeScenario failed')),
            beforeStep: () => Promise.reject(new Error('beforeStep failed')),
            beforeCommand: () => Promise.reject(new Error('beforeCommand failed')),
            afterCommand: () => Promise.reject(new Error('afterCommand failed')),
            afterStep: () => Promise.reject(new Error('afterStep failed')),
            afterScenario: () => Promise.reject(new Error('afterScenario failed')),
            afterFeature: () => Promise.reject(new Error('afterFeature failed'))
        }, specs, {})
        await expect(adapter.run()).resolves.toEqual(0)
    })
})
