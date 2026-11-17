import { describe, it, expect } from 'vitest'

import { getTimeouts } from '../../../src/commands/browser/getTimeouts.js'
import { getWindowHandle } from '../../../src/commands/browser/getWindowHandle.js'
import { setTimeouts } from '../../../src/commands/browser/setTimeouts.js'
import { getWaitOptions } from '../../../src/settings.js'
import { createSession } from '../../__fixtures__/session.js'

describe('setTimeouts and getTimeouts', () => {
    it('says how long the commands of an element wait', async () => {
        expect(await getTimeouts(createSession())).toEqual({ implicit: 5000 })
        expect(await getTimeouts(createSession(undefined, { timeout: 15000, interval: 100 }))).toEqual({ implicit: 15000 })
    })

    it('sets how long the commands of an element wait from now on', async () => {
        const session = createSession()

        expect(await setTimeouts(session, 10000)).toBe(null)
        expect(session.timeouts).toEqual({ implicit: 10000 })
        expect(getWaitOptions(session, { waitforTimeout: 3000 })).toEqual({ timeout: 10000, interval: 100 })

        await setTimeouts(session, 0)
        expect(getWaitOptions(session).timeout).toBe(0)
    })

    it('keeps the timeout if it is called without one', async () => {
        const session = createSession()
        await setTimeouts(session, 10000)
        await setTimeouts(session)
        expect(session.timeouts).toEqual({ implicit: 10000 })
    })

    it('does not take a timeout that is not a time', async () => {
        const session = createSession()
        await expect(setTimeouts(session, -1)).rejects.toThrow('The timeout "implicit" has to be a number of 0 or more, got: -1')
        await expect(setTimeouts(session, '5000' as unknown as number)).rejects.toThrow('The timeout "implicit" has to be a number of 0 or more, got: "5000"')
        expect(session.timeouts).toEqual({})
    })

    it('does nothing with the page load and the script timeout, a native app has neither', async () => {
        const session = createSession()
        const set = setTimeouts as (...args: unknown[]) => Promise<null>

        // WebdriverIO sets the script timeout itself when an iOS session starts
        expect(await set(session, undefined, undefined, 30000)).toBe(null)
        expect(await set(session, undefined, 2000)).toBe(null)

        expect(session.timeouts).toEqual({})
        expect(await getTimeouts(session)).toEqual({ implicit: 5000 })
    })
})

describe('getWindowHandle', () => {
    it('is the native app, the driver has no web views yet', async () => {
        expect(await getWindowHandle()).toBe('NATIVE_APP')
    })
})
