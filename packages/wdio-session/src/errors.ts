import { SnapshotError } from '@wdio/snapshot'

import { ERROR_CODES, type ErrorCode } from './constants.js'
import type { SerializedError } from './types.js'

export interface SessionErrorOptions {
    hint?: string
    package?: string
    install?: string[]
    details?: string
    cause?: unknown
}

export class SessionError extends Error {
    code: ErrorCode
    hint?: string
    package?: string
    install?: string[]
    details?: string

    constructor (code: ErrorCode, message: string, opts: SessionErrorOptions = {}) {
        super(message, { cause: opts.cause })
        this.name = 'SessionError'
        this.code = code
        this.hint = opts.hint
        this.package = opts.package
        this.install = opts.install
        this.details = opts.details
    }

    get exitCode () {
        return ERROR_CODES[this.code]
    }

    toJSON (): SerializedError {
        return {
            code: this.code,
            message: this.message,
            ...(this.hint ? { hint: this.hint } : {}),
            ...(this.package ? { package: this.package } : {}),
            ...(this.install ? { install: this.install } : {}),
            ...(this.details ? { details: this.details } : {})
        }
    }

    static from (err: unknown, fallback: ErrorCode = 'INTERNAL'): SessionError {
        if (err instanceof SessionError) {
            return err
        }
        const e = err as Error & { code?: string, package?: string, install?: string[], feature?: string }
        if (e && e.code === 'MISSING_DEPENDENCY') {
            return new SessionError('MISSING_DEPENDENCY', e.message, { package: e.package, install: e.install })
        }
        return new SessionError(fallback, e?.message || String(err), { cause: err })
    }

    static fromJSON (json: SerializedError) {
        return new SessionError(json.code in ERROR_CODES ? json.code as ErrorCode : 'INTERNAL', json.message, json)
    }
}

export const usage = (message: string, hint?: string) => new SessionError('USAGE', message, { hint })
export const notSupported = (message: string, hint?: string) => new SessionError('NOT_SUPPORTED', message, { hint })

const USAGE_SNAPSHOT_CODES = new Set(['USAGE', 'INVALID_REGEX'])

/**
 * Run snapshot code, turning its usage errors into the session's `USAGE`.
 */
export function asUsage<T> (fn: () => T): T {
    try {
        return fn()
    } catch (err) {
        if (err instanceof SnapshotError && USAGE_SNAPSHOT_CODES.has(err.code)) {
            throw usage(err.message, err.hint)
        }
        throw err
    }
}
