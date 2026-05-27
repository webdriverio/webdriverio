import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import * as bstackLogger from '../../src/bstackLogger.js'
import { BStackLogger } from '../../src/cli/cliLogger.js'

import { BrowserstackCLI } from '../../src/cli/index.js'

const bstackLoggerSpy = vi.spyOn(bstackLogger.BStackLogger, 'logToFile')
bstackLoggerSpy.mockImplementation(() => {})

describe('BrowserstackCLI bootstrap error surfacing', () => {
    let instance: any
    let loggerErrorSpy: ReturnType<typeof vi.spyOn>
    let loggerDebugSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        instance = BrowserstackCLI.getInstance()
        loggerErrorSpy = vi.spyOn(BStackLogger, 'error').mockImplementation(() => {})
        loggerDebugSpy = vi.spyOn(BStackLogger, 'debug').mockImplementation(() => {})
    })

    afterEach(() => {
        vi.restoreAllMocks()
        // Reset singleton fields touched by loadModules tests so each case
        // starts from a known state.
        instance.binSessionId = null
        instance.config = {}
        instance.modules = {}
    })

    describe('logBuildErrors', () => {
        it('is a no-op when testhub.errors is absent', () => {
            instance.logBuildErrors({ binSessionId: 'b1', config: '{}' } as any)
            expect(loggerErrorSpy).not.toHaveBeenCalled()
        })

        it('is a no-op when testhub.errors is empty', () => {
            instance.logBuildErrors({
                binSessionId: 'b1',
                config: '{}',
                testhub: { errors: Buffer.from('') }
            } as any)
            expect(loggerErrorSpy).not.toHaveBeenCalled()
        })

        it('logs each entry as [Build] <code>: <message>', () => {
            const errors = {
                ERROR_ACCESS_DENIED: { message: 'Access to BrowserStack denied due to incorrect credentials.', type: 'info' },
                ERROR_OBSERVABILITY_NOT_ALLOWED: { message: 'Observability is not enabled for this account.', type: 'error' }
            }
            instance.logBuildErrors({
                binSessionId: 'b1',
                config: '{}',
                testhub: { errors: Buffer.from(JSON.stringify(errors)) }
            } as any)
            expect(loggerErrorSpy).toHaveBeenCalledWith('[Build] ERROR_ACCESS_DENIED: Access to BrowserStack denied due to incorrect credentials.')
            expect(loggerErrorSpy).toHaveBeenCalledWith('[Build] ERROR_OBSERVABILITY_NOT_ALLOWED: Observability is not enabled for this account.')
            expect(loggerErrorSpy).toHaveBeenCalledTimes(2)
        })

        it('emits a debug log and does NOT throw when testhub.errors is unparseable', () => {
            instance.logBuildErrors({
                binSessionId: 'b1',
                config: '{}',
                testhub: { errors: Buffer.from('{not-valid-json') }
            } as any)
            expect(loggerErrorSpy).not.toHaveBeenCalled()
            expect(loggerDebugSpy).toHaveBeenCalled()
        })
    })

    describe('loadModules apis-missing guard', () => {
        it('throws a self-contained error when setConfig leaves config.apis undefined', () => {
            // setConfig parses response.config; an empty JSON object is valid
            // but leaves config.apis missing — the same shape the binary
            // returns on auth failure.
            const response = {
                binSessionId: 'b1',
                config: '{}'
            } as any
            expect(() => instance.loadModules(response)).toThrowError(
                /BrowserStack binary returned an incomplete config/
            )
        })

        it('logs preceding build errors BEFORE throwing on the apis-missing guard', () => {
            const errors = {
                ERROR_ACCESS_DENIED: { message: 'Access to BrowserStack denied due to incorrect credentials.', type: 'info' }
            }
            const response = {
                binSessionId: 'b1',
                config: '{}',
                testhub: { errors: Buffer.from(JSON.stringify(errors)) }
            } as any
            expect(() => instance.loadModules(response)).toThrowError(/incomplete config/)
            expect(loggerErrorSpy).toHaveBeenCalledWith('[Build] ERROR_ACCESS_DENIED: Access to BrowserStack denied due to incorrect credentials.')
        })

        it('does not throw the apis-missing error when setConfig parses a config with apis present', () => {
            // Stub the downstream modules so loadModules doesn't try to
            // initialize them — we only want to confirm the guard does NOT
            // fire when apis is present. Any later setup failure is
            // unrelated to the guard we're testing.
            const config = {
                apis: {
                    automate: { api: 'https://api.browserstack.com' },
                    appAutomate: { api: 'https://api.browserstack.com' },
                    percy: { api: 'https://percy.io' },
                    appAccessibility: { api: 'https://a11y.browserstack.com' },
                    observability: { api: 'https://observability.browserstack.com', upload: '' },
                    edsInstrumentation: { api: '' }
                }
            }
            const response = {
                binSessionId: 'b1',
                config: JSON.stringify(config)
            } as any
            // Best-effort: loadModules may still throw further on, but the
            // thrown error must NOT be the apis-missing guard text.
            try {
                instance.loadModules(response)
            } catch (err: any) {
                expect(err.message).not.toMatch(/incomplete config/)
            }
        })
    })
})
