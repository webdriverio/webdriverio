import { describe, it, expect, vi } from 'vitest'
import { SESSION_ENDED_ERROR } from 'webdriver'

import { logBackgroundError } from '../../src/utils/sessionEnded.js'

const log = () => ({ debug: vi.fn(), warn: vi.fn() })
const sessionEnded = (message: string) => Object.assign(new Error(message), { name: SESSION_ENDED_ERROR })

describe('logBackgroundError', () => {
    it('logs a session end error at debug level', () => {
        const logger = log()
        logBackgroundError(logger, 'Failed to update', sessionEnded('No connection to WebDriver Bidi was established'))
        expect(logger.debug).toHaveBeenCalledWith('Failed to update, the session ended: No connection to WebDriver Bidi was established')
        expect(logger.warn).not.toHaveBeenCalled()
    })

    it('logs any error at debug level when the WebDriver BiDi connection of the browser closed', () => {
        const logger = log()
        logBackgroundError(logger, 'Failed to switch', new Error('Request failed with error code UND_ERR_CLOSED'), { _bidiHandler: { isClosed: true } })
        expect(logger.debug).toHaveBeenCalledWith('Failed to switch, the session ended: Request failed with error code UND_ERR_CLOSED')
        expect(logger.warn).not.toHaveBeenCalled()
    })

    it('warns for another error while the connection is open, never connected, or does not exist', () => {
        for (const browser of [{ _bidiHandler: { isConnected: true, isClosed: false } }, { _bidiHandler: { isConnected: false, isClosed: false } }, {}, undefined]) {
            const logger = log()
            logBackgroundError(logger, 'Failed to switch', new Error('Request failed with error code UND_ERR_CLOSED'), browser)
            expect(logger.warn).toHaveBeenCalledWith('Failed to switch: Request failed with error code UND_ERR_CLOSED')
            expect(logger.debug).not.toHaveBeenCalled()
        }
    })
})
