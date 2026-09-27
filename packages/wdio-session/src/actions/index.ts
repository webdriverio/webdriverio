import type { ActionFn } from '../session.js'
import * as lifecycle from './lifecycle.js'
import { exec } from './exec.js'
import * as observe from './observe.js'

/**
 * Arguments of an action as parsed by the CLI (camelCase keys) plus `$cwd`,
 * the working directory of the caller.
 */
export type ActionArgs = Record<string, unknown> & { $cwd: string }

export const IMPLEMENTATIONS: Record<string, ActionFn> = {
    info: lifecycle.info,
    close: lifecycle.close,
    resume: lifecycle.resume,
    exec,
    snapshot: observe.snapshot,
    find: observe.find,
    diff: observe.diff,
    screenshot: observe.screenshot,
    source: observe.source
}
