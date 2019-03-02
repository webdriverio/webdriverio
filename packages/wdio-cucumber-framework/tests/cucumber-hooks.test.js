import path from 'path'
import { CucumberAdapter } from '../src'
import configNativePromises from './fixtures/cucumber-hooks.conf'
const specs = [path.join(__dirname, '/fixtures/sample.feature')]

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
        setTimeout(() => resolve(), 100)
    }),
    click: () => new Promise((resolve) => {
        setTimeout(() => resolve(), 100)
    }),
    getTitle: (ms = 100) => new Promise((resolve) => {
        setTimeout(() => resolve('Google'), ms)
    }),
    pause: (ms = 100) => new Promise((resolve) => {
        setTimeout(() => resolve(), ms)
    }),
    addCommand: (name, fn) => {
        this[name] = fn
    }
}

process.send = NOOP

describe('Executes feature files with cucumber hooks', () => {
    it('should get executed', async () => {
        const adapter = new CucumberAdapter(0, configNativePromises, specs, configNativePromises.capabilities)
        await expect(adapter.run()).resolves.toEqual(0)
    })
})
