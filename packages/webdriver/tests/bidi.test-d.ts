import { expectTypeOf, describe } from 'vitest'
import type { remote } from '../src/browser.js'

describe('Bidi Type testing', () => {
    const browser = {} as WebdriverIO.Browser

    describe('SessionSubscribeParameters type', () => {
        const sessionSubscribeParams: remote.SessionSubscribeParameters = {
            events: ['log.entryAdded'],
            contexts: ['browsingContexts'],
        }

        expectTypeOf(sessionSubscribeParams).toEqualTypeOf<remote.SessionSubscribeParameters>()
        expectTypeOf(browser.sessionSubscribe).toBeCallableWith(sessionSubscribeParams)
    })
})
