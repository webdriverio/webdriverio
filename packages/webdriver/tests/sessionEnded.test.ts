import { describe, it, expect } from 'vitest'

import { SESSION_ENDED_ERROR, isSessionEndedError, isBidiConnectionClosed } from '../src/index.js'

describe('isSessionEndedError', () => {
    it('knows a session end error of this package and the invalid session id error of a driver', () => {
        expect(isSessionEndedError(Object.assign(new Error('got no result'), { name: SESSION_ENDED_ERROR }))).toBe(true)
        expect(isSessionEndedError(Object.assign(new Error('the session is gone'), { name: 'invalid session id' }))).toBe(true)
    })

    it('does not know other errors, also with a similar message', () => {
        expect(isSessionEndedError(new Error('WebDriver Bidi command "x" with id 1 got no result: the connection was closed'))).toBe(false)
        expect(isSessionEndedError(Object.assign(new Error('x'), { name: 'no such request' }))).toBe(false)
        expect(isSessionEndedError('session ended')).toBe(false)
        expect(isSessionEndedError(undefined)).toBe(false)
    })
})

describe('isBidiConnectionClosed', () => {
    it('is true when the WebDriver BiDi connection of the client was closed', () => {
        expect(isBidiConnectionClosed({ _bidiHandler: { isClosed: true } })).toBe(true)
    })

    it('is false while the connection is open, before it connected, or without one', () => {
        expect(isBidiConnectionClosed({ _bidiHandler: { isClosed: false } })).toBe(false)
        expect(isBidiConnectionClosed({})).toBe(false)
        expect(isBidiConnectionClosed(undefined)).toBe(false)
    })
})
