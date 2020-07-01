import * as webdriverio from '../src'

describe('index.js', () => {
    it('exports attach method', () => {
        expect(webdriverio.attach).toBeDefined()
    })

    it('exports attach method', () => {
        expect(webdriverio.multiremote).toBeDefined()
    })

    it('exports attach method', () => {
        expect(webdriverio.remote).toBeDefined()
    })

    it('exports attach method', () => {
        expect(webdriverio.SevereServiceError).toBeDefined()
    })
})
