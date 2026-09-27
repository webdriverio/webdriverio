import type { ActionFn } from '../session.js'
import * as lifecycle from './lifecycle.js'
import { exec } from './exec.js'
import * as observe from './observe.js'
import * as interact from './interact.js'

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
    source: observe.source,
    navigate: interact.navigate,
    back: interact.back,
    forward: interact.forward,
    reload: interact.reload,
    click: interact.click,
    tap: interact.tap,
    fill: interact.fill,
    type: interact.type,
    press: interact.press,
    select: interact.select,
    upload: interact.upload,
    hover: interact.hover,
    drag: interact.drag,
    scroll: interact.scroll,
    swipe: interact.swipe,
    'long-press': interact.longPress
}
