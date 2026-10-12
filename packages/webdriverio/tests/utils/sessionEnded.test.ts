import { describe, it, expect, vi } from 'vitest'

import { isSessionEndedError, logBackgroundError } from '../../src/utils/sessionEnded.js'

describe('isSessionEndedError', () => {
    it('knows the errors of a command when the session or its connection ended', () => {
        for (const message of [
            'WebDriver Bidi command "browsingContext.getTree" with id 13 got no result: the connection was closed',
            'WebDriver Bidi command "browsingContext.getTree" with id 13 got no result: the browser or the driver closed the connection (code 1006)',
            'No connection to WebDriver Bidi was established',
            'Trying to run command "switchToWindow("a")" after session has been deleted, aborting request without executing it',
            'WebDriverError: invalid session id when running "window" with method "POST"'
        ]) {
            expect(isSessionEndedError(new Error(message))).toBe(true)
        }
    })

    it('does not know other errors', () => {
        expect(isSessionEndedError(new Error('no such request'))).toBe(false)
        expect(isSessionEndedError(new Error('unknown error: the tree is not available'))).toBe(false)
        expect(isSessionEndedError('no connection')).toBe(false)
    })
})

describe('logBackgroundError', () => {
    const log = () => ({ debug: vi.fn(), warn: vi.fn() })

    it('logs a session end at debug level', () => {
        const logger = log()
        logBackgroundError(logger, 'Failed to update', new Error('No connection to WebDriver Bidi was established'))
        expect(logger.debug).toHaveBeenCalledWith('Failed to update, the session ended: No connection to WebDriver Bidi was established')
        expect(logger.warn).not.toHaveBeenCalled()
    })

    it('logs another error as a warning', () => {
        const logger = log()
        logBackgroundError(logger, 'Failed to update', new Error('unknown error'))
        expect(logger.warn).toHaveBeenCalledWith('Failed to update: unknown error')
        expect(logger.debug).not.toHaveBeenCalled()
    })
})
