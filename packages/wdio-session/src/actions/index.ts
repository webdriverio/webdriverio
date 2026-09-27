import type { ActionFn } from '../session.js'
import * as lifecycle from './lifecycle.js'
import { exec } from './exec.js'
import * as observe from './observe.js'
import * as interact from './interact.js'
import * as contexts from './contexts.js'
import { emulate, geolocation } from './emulate.js'
import * as network from './network.js'
import * as state from './state.js'
import { exportSpec, history } from './export.js'
import { helpers } from './helpers.js'
import { visual } from './visual.js'

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
    helpers,
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
    'long-press': interact.longPress,
    tabs: contexts.tabs,
    windows: contexts.windows,
    frame: contexts.frame,
    contexts: contexts.contexts,
    dialog: contexts.dialog,
    emulate,
    geolocation,
    logs: network.logs,
    requests: network.requests,
    mock: network.mock,
    unmock: network.unmock,
    cookies: state.cookies,
    storage: state.storage,
    state: state.state,
    history,
    export: exportSpec,
    visual
}
