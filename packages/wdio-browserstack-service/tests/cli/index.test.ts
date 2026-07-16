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

    describe('loadModules integration', () => {
        it('logs build errors BEFORE the downstream apis dereference fails', () => {
            // On an auth-failure response the binary returns an empty
            // config string. setConfig parses it as `{}`, leaving
            // this.config.apis undefined, so APIUtils.updateURLSForGRR
            // throws a TypeError when it dereferences `apis.automate`.
            // The PR's invariant is that the [Build] error line is
            // logged BEFORE that downstream throw, so the user sees the
            // actionable cause first.
            const errors = {
                ERROR_ACCESS_DENIED: { message: 'Access to BrowserStack denied due to incorrect credentials.', type: 'info' }
            }
            const response = {
                binSessionId: 'b1',
                config: '{}',
                testhub: { errors: Buffer.from(JSON.stringify(errors)) }
            } as any
            try {
                instance.loadModules(response)
            } catch {
                // expected — updateURLSForGRR throws on missing apis
            }
            expect(loggerErrorSpy).toHaveBeenCalledWith('[Build] ERROR_ACCESS_DENIED: Access to BrowserStack denied due to incorrect credentials.')
        })
    })
})
