import { expectTypeOf, describe } from 'vitest'
import type { remote } from '../src/browser.js'

describe('Bidi Type testing', () => {
    const browser = {} as WebdriverIO.Browser

    describe('Renaming of SessionSubscriptionRequest is not breaking', () => {
        const sessionSubscribeParams: remote.SessionSubscribeParameters = {
            events: ['log.entryAdded'],
            contexts: ['browsingContexts'],
        }
        const sessionSubscriptionRequest: remote.SessionSubscriptionRequest = {
            events: ['log.entryAdded'],
            contexts: ['browsingContexts'],
        }

        expectTypeOf(sessionSubscribeParams).toEqualTypeOf<remote.SessionSubscribeParameters>()
        expectTypeOf(sessionSubscriptionRequest).toEqualTypeOf<remote.SessionSubscribeParameters>()
        expectTypeOf(browser.sessionSubscribe).toBeCallableWith(sessionSubscribeParams)
        expectTypeOf(browser.sessionSubscribe).toBeCallableWith(sessionSubscriptionRequest)
    })
})
