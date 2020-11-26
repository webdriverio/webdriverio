import * as webdriverio from '../src'

// If you're making a change here, like adding a new export, the TypeScript
// typings may need an update : packages/webdriverio/webdriverio.d.ts

describe('index.js', () => {
    it('exports remote method', () => {
        expect(webdriverio.remote).toBeDefined()
    })

    it('exports attach method', () => {
        expect(webdriverio.attach).toBeDefined()
    })

    it('exports multiremote method', () => {
        expect(webdriverio.multiremote).toBeDefined()
    })

    it('exports remote method', () => {
        expect(webdriverio.remote).toBeDefined()
    })

    it('exports SevereServiceError class', () => {
        expect(webdriverio.SevereServiceError).toBeDefined()
    })
})
