import path from 'node:path'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import * as bstackLogger from '../src/bstackLogger.js'
import { validateSkipAppOverride } from '../src/util.js'
import { NOT_ALLOWED_KEYS_IN_CAPS } from '../src/constants.js'
import BrowserStackConfig from '../src/config.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('uuid', () => ({ v4: () => 'test-uuid' }))
// util.ts imports formdata-node (ESM-only) at module load for the log-upload path; the code under
// test here never uses FormData, so mock it to keep this suite decoupled from that import.
vi.mock('formdata-node', () => ({ FormData: class {}, File: class {} }))
vi.mock('formdata-node/file-from-path', () => ({ fileFromPath: vi.fn() }))
// ESM-only transitive deps dragged in by util.ts's module graph (log upload, cli modules). None are
// exercised by these validator/classification tests — factory-mock them so the graph loads under vitest.
vi.mock('got', () => ({ default: vi.fn() }))
vi.mock('tar', () => ({ default: {}, create: vi.fn(), extract: vi.fn() }))
vi.mock('git-repo-info', () => ({ default: vi.fn(() => ({})) }))

// Isolate the warning surface — BStackLogger.warn otherwise writes to the log file + wdio logger.
const warnSpy = vi.spyOn(bstackLogger.BStackLogger, 'warn').mockImplementation(() => {})
vi.spyOn(bstackLogger.BStackLogger, 'logToFile').mockImplementation(() => {})

const STANDARD_WARNING = '[BrowserStack] \'skipAppOverride: true\' is set. The SDK will treat this session as App Automate and will NOT manage app upload or inject app capabilities. If you intended to run an Automate (browser/website) session, remove \'skipAppOverride\' — leaving it set will cause Automate sessions to behave incorrectly.'
const CONFLICT_WARNING = 'Conflict detected. skipAppOverride: true is active; ignoring the app provided in the browserstack service options.'
const MISSING_APP_ERROR = 'App capability is missing. When skipAppOverride is set to \'false\', a valid app capability (hash/shareable id/path/custom_id) must be provided.'

describe('validateSkipAppOverride', () => {
    beforeEach(() => {
        warnSpy.mockClear()
        delete process.env.BROWSERSTACK_SKIP_APP_OVERRIDE_WARNED
    })
    afterEach(() => {
        delete process.env.BROWSERSTACK_SKIP_APP_OVERRIDE_WARNED
    })

    it('is a no-op when options is undefined', () => {
        expect(() => validateSkipAppOverride(undefined)).not.toThrow()
        expect(warnSpy).not.toHaveBeenCalled()
    })

    it('emits the standard warning verbatim once when skipAppOverride:true with no app', () => {
        const options = { skipAppOverride: true } as any
        validateSkipAppOverride(options)
        expect(warnSpy).toHaveBeenCalledTimes(1)
        expect(warnSpy).toHaveBeenCalledWith(STANDARD_WARNING)
        expect(options.app).toBeUndefined()
    })

    it('coerces the string "true" (3-state semantics)', () => {
        validateSkipAppOverride({ skipAppOverride: 'true' } as any)
        expect(warnSpy).toHaveBeenCalledWith(STANDARD_WARNING)
    })

    it('edge-1: skipAppOverride:true + app => conflict warning verbatim and app is cleared', () => {
        const options = { skipAppOverride: true, app: 'bs://abc' } as any
        validateSkipAppOverride(options)
        expect(warnSpy).toHaveBeenCalledWith(STANDARD_WARNING)
        expect(warnSpy).toHaveBeenCalledWith(CONFLICT_WARNING)
        expect(options.app).toBeUndefined()
    })

    it('edge-2: explicit false + no app => throws the exact missing-app error', () => {
        expect(() => validateSkipAppOverride({ skipAppOverride: false } as any)).toThrow(MISSING_APP_ERROR)
    })

    it('edge-2: string "false" + no app => throws', () => {
        expect(() => validateSkipAppOverride({ skipAppOverride: 'false' } as any)).toThrow(MISSING_APP_ERROR)
    })

    it('explicit false WITH an app => no throw, no warning', () => {
        expect(() => validateSkipAppOverride({ skipAppOverride: false, app: 'bs://abc' } as any)).not.toThrow()
        expect(warnSpy).not.toHaveBeenCalled()
    })

    it('edge-3: unset + no app => no-op, no warning, no throw', () => {
        expect(() => validateSkipAppOverride({} as any)).not.toThrow()
        expect(warnSpy).not.toHaveBeenCalled()
    })

    it('emit-once: a second call in the same process does not re-warn', () => {
        validateSkipAppOverride({ skipAppOverride: true } as any)
        expect(warnSpy).toHaveBeenCalledTimes(1)
        warnSpy.mockClear()
        validateSkipAppOverride({ skipAppOverride: true } as any)
        expect(warnSpy).not.toHaveBeenCalled()
    })

    it('never emits a Tier-2 "does not support App Automate" warning (WDIO supports App Automate)', () => {
        validateSkipAppOverride({ skipAppOverride: true } as any)
        const messages = warnSpy.mock.calls.map((c) => String(c[0]))
        expect(messages.some((m) => m.includes('does not support App Automate'))).toBe(false)
    })
})

describe('NOT_ALLOWED_KEYS_IN_CAPS cloud-leak strip', () => {
    it('includes skipAppOverride so it is never forwarded to bstack:options', () => {
        expect(NOT_ALLOWED_KEYS_IN_CAPS).toContain('skipAppOverride')
    })
})

describe('BrowserStackConfig appAutomate honors skipAppOverride', () => {
    const baseConfig = { framework: 'mocha', user: 'u', key: 'k' } as any
    beforeEach(() => {
        (BrowserStackConfig as any)._instance = undefined
    })

    it('marks app_automate when skipAppOverride is true with no app', () => {
        const cfg = BrowserStackConfig.getInstance({ skipAppOverride: true } as any, baseConfig)
        expect(cfg.appAutomate).toBe(true)
        expect(cfg.automate).toBe(false)
    })

    it('marks app_automate for the string "true"', () => {
        const cfg = BrowserStackConfig.getInstance({ skipAppOverride: 'true' } as any, baseConfig)
        expect(cfg.appAutomate).toBe(true)
    })

    it('keeps automate for a web run (skipAppOverride false, no app)', () => {
        const cfg = BrowserStackConfig.getInstance({ skipAppOverride: false } as any, baseConfig)
        expect(cfg.appAutomate).toBe(false)
        expect(cfg.automate).toBe(true)
    })

    it('still marks app_automate when options.app is set (existing behaviour)', () => {
        const cfg = BrowserStackConfig.getInstance({ app: 'bs://abc' } as any, baseConfig)
        expect(cfg.appAutomate).toBe(true)
    })
})
