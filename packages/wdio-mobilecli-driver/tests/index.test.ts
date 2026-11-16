import { describe, it, expect } from 'vitest'

import MobilecliDriver from '../src/index.js'

describe('MobilecliDriver', () => {
    it('has the functions WebdriverIO calls on an automation protocol driver', () => {
        expect(MobilecliDriver.newSession).toBeTypeOf('function')
        expect(MobilecliDriver.attachToSession).toBeTypeOf('function')
        expect(MobilecliDriver.reloadSession).toBeTypeOf('function')
    })

    it('says that a session can not be started yet', async () => {
        await expect(MobilecliDriver.newSession({ capabilities: {} }))
            .rejects.toThrow('newSession: @wdio/mobilecli-driver does not implement this yet')
    })

    it('says that attaching and reloading are not there yet', async () => {
        expect(() => MobilecliDriver.attachToSession())
            .toThrow('attachToSession: @wdio/mobilecli-driver does not implement this yet')
        await expect(MobilecliDriver.reloadSession())
            .rejects.toThrow('reloadSession: @wdio/mobilecli-driver does not implement this yet')
    })
})
