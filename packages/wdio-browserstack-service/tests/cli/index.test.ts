import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { BrowserstackCLI } from '../../src/cli/index.js'
import * as bstackLogger from '../../src/bstackLogger.js'

const bstackLoggerSpy = vi.spyOn(bstackLogger.BStackLogger, 'logToFile')
bstackLoggerSpy.mockImplementation(() => {})

describe('BrowserstackCLI', () => {
    let browserstackCLI: BrowserstackCLI
    // const mockHandler = vi.fn()
    let startMainSpy: any
    let startChildSpy: any

    beforeEach(() => {
        vi.resetAllMocks()
        browserstackCLI = BrowserstackCLI.getInstance()
    })
    afterEach(() => {
        vi.resetAllMocks()
    })

    describe('bootstrap', () => {
        it('start main process if initiating first time', async () => {
            startMainSpy = vi.spyOn(browserstackCLI, 'startMain').mockImplementation(async () => {})
            startChildSpy = vi.spyOn(browserstackCLI, 'startChild').mockImplementation(async () => {})

            // Ensure the environment variable is cleared
            delete process.env.BROWSERSTACK_CLI_BIN_SESSION_ID

            const wdioConfig = 'DummyConfig'
            await browserstackCLI.bootstrap(wdioConfig)
            expect(startMainSpy).toHaveBeenCalledOnce()
            expect(startChildSpy).not.toHaveBeenCalled()
        })
    })
})
