import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import * as bstackLogger from '../../src/bstackLogger.js'
import { CLIUtils } from '../../build/cli/cliUtils.js'

const bstackLoggerSpy = vi.spyOn(bstackLogger.BStackLogger, 'logToFile')
bstackLoggerSpy.mockImplementation(() => {})

describe('CLIUtils', () => {

    beforeEach(() => {
        vi.resetAllMocks()
    })
    afterEach(() => {
        vi.resetAllMocks()
    })

    describe('isDevelopmentEnv', () => {
        it('returns true if env is set to development', async () => {
            process.env.BROWSERSTACK_CLI_ENV = 'development'

            expect(CLIUtils.isDevelopmentEnv()).toBe(true)
        })

        it('returns false if env is not set to development', async () => {
            process.env.BROWSERSTACK_CLI_ENV = 'production'

            expect(CLIUtils.isDevelopmentEnv()).toBe(false)
        })
    })
})
