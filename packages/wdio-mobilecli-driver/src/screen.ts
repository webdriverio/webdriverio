import logger from '@wdio/logger'
import { ELEMENT_KEY } from 'webdriver'

import { PACKAGE_NAME, SUPPORTED_STRATEGIES } from './constants.js'
import { ElementError, type Observation } from './elements.js'
import { findNodes, isNodeEnabled, isNodeVisible, isSupportedStrategy, type DumpResult, type TreeNode } from './tree.js'
import type { Session } from './types.js'

const log = logger(PACKAGE_NAME)

/**
 * What the commands share. mobilecli only knows the screen, not elements:
 * every command reads the UI tree (`device.dump.ui`) and looks up its
 * element in it.
 *
 * The commands wait the way Mobilewright does (`locator.ts` of
 * `mobilewright-core`), so that a test does not need waits of its own:
 * - an action (tap, type, clear) waits until the element is visible, is
 *   enabled and has stable bounds
 * - a read (text, value) waits until the element is visible
 * How long they wait is a setting of the session, see `getWaitOptions`.
 *
 * A look at the screen is the slow part (100 to 250 ms), so the driver
 * remembers what it saw of an element, see `Observation`. WebdriverIO finds
 * an element and sends the command for it right after: the command uses
 * what the find saw.
 */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * the UI tree of what is on the screen now
 */
export async function dumpUI (session: Session) {
    const result = await session.rpc.call<DumpResult>('device.dump.ui', { deviceId: session.device.id })
    const dump = { ...result, elements: result?.elements || [] }
    session.lastDump = { tree: dump.elements, at: Date.now(), served: new Map() }
    return dump
}

/**
 * forget what the driver saw of the screen
 */
export function forgetScreen (session: Session) {
    session.elements.forgetObservations()
    session.lastDump = undefined
}

/**
 * Do something on the screen. What the driver saw of the elements is not
 * true anymore after it.
 * @param  options.mask  hide the `text` of the call in the log, see
 *                       `RpcClient.call`
 */
export async function act (
    session: Session,
    method: string,
    params: Record<string, unknown> = {},
    timeout?: number,
    { mask = false }: { mask?: boolean } = {}
) {
    forgetScreen(session)
    try {
        return await session.rpc.call(method, { deviceId: session.device.id, ...params }, timeout, { mask })
    } finally {
        forgetScreen(session)
    }
}

/**
 * Find elements on the screen and give them an id. It does not wait:
 * WebdriverIO waits for an element that a command needs.
 *
 * Finds share a look at the screen. A test often finds several elements in
 * a row to read from them (`expect($(a)).toHaveText()`, then `$(b)`, ...),
 * and every look takes 100 to 250 ms. A find uses the last look if
 * - it is less than `screenFreshTime` ms old and the driver did nothing on
 *   the screen since,
 * - the selector matches in it: an element that is not there may have come
 *   since, and a wait for an element needs a new look every time,
 * - and this selector was searched in it less than `maxSearchesPerScreen`
 *   times. WebdriverIO searches a second time right after its wait found
 *   the element. More often is a wait until the element is gone, which
 *   needs a new look every time.
 * @return the element references, in the order of the UI tree
 */
export async function findElementReferences (session: Session, using: string, value: string) {
    if (!isSupportedStrategy(using)) {
        const error = new Error(
            `The selector "${value}" uses the strategy "${using}", which ${PACKAGE_NAME} does not support. ` +
            `Supported are: ${SUPPORTED_STRATEGIES.join(', ')}.`
        )
        error.name = 'invalid selector'
        throw error
    }

    const key = JSON.stringify([using, value])
    const platform = session.device.platform
    const { screenFreshTime, maxSearchesPerScreen, stabilityWindow } = session.settings
    let dump = session.lastDump
    let nodes = dump && Date.now() - dump.at < screenFreshTime && (dump.served.get(key) || 0) < maxSearchesPerScreen
        ? findNodes(dump.tree, platform, using, value)
        : []
    if (nodes.length === 0) {
        await dumpUI(session)
        dump = session.lastDump!
        nodes = findNodes(dump.tree, platform, using, value)
    }
    dump!.served.set(key, (dump!.served.get(key) || 0) + 1)

    return nodes.map((node, index) => {
        const elementId = session.elements.register({ using, value, index })
        session.elements.observe(elementId, node, stabilityWindow, dump!.at)
        return { [ELEMENT_KEY]: elementId }
    })
}

/**
 * look at the screen for an element and remember what was seen
 * @return `null` if the element is not on the screen
 * @throws `no such element` if the id is not of this session
 */
async function look (session: Session, elementId: string): Promise<Observation | null> {
    const { elements: tree } = await dumpUI(session)
    try {
        const node = session.elements.resolve(elementId, tree, session.device.platform)
        return session.elements.observe(elementId, node, session.settings.stabilityWindow, session.lastDump!.at)
    } catch (error) {
        if (error instanceof ElementError && error.name === 'stale element reference') {
            session.elements.forgetObservation(elementId)
            return null
        }
        throw error
    }
}

/**
 * an element as it is on the screen now, without waiting
 * @return `null` if the element is not on the screen
 * @throws `no such element` if the id is not of this session
 */
export async function getNode (session: Session, elementId: string): Promise<TreeNode | null> {
    return (await look(session, elementId))?.node ?? null
}

type Check = 'visible' | 'actionable'

/**
 * why an element does not pass a check, `undefined` if it does
 */
function getReason (node: TreeNode | undefined, check: Check) {
    if (!node) {
        return 'no matching element found'
    }
    if (!isNodeVisible(node)) {
        return 'element found but not visible'
    }
    if (check === 'actionable' && !isNodeEnabled(node)) {
        return 'element found but not enabled'
    }
}

/**
 * Wait until an element passes a check.
 * - `visible`, for a command that reads from the element. It is
 *   `locator.resolveVisible()` of Mobilewright.
 * - `actionable`, for a command that uses the element: it is visible,
 *   enabled, and at the same place in two looks at the screen, so it is not
 *   moving. It is `locator.resolveActionable()` of Mobilewright.
 *
 * Mobilewright looks at the screen itself, twice for `actionable`. The
 * driver counts the looks of WebdriverIO: it found the element right before
 * the command (one look), or it waited for the element and then found it
 * (two looks). So a command mostly needs one more look or none.
 * @return the element as it is on the screen
 */
async function waitFor (session: Session, elementId: string, check: Check): Promise<TreeNode> {
    const { timeout, interval } = session.wait
    const { screenFreshTime, stabilityDelay } = session.settings
    const deadline = Date.now() + timeout
    let seen = session.elements.getObservation(elementId, screenFreshTime) || null

    while (true) {
        seen = seen || await look(session, elementId)
        const reason = getReason(seen?.node, check)

        if (seen && !reason) {
            /**
             * an element that keeps moving is used where it is when the
             * time is up, the same as in Mobilewright
             */
            if (check === 'visible' || seen.stable || Date.now() >= deadline) {
                return seen.node
            }
            await sleep(stabilityDelay)
        } else {
            if (Date.now() >= deadline) {
                const { using, value } = session.elements.getQuery(elementId)
                const error = new Error(`Element with the selector "${value}" (${using}): ${reason} after ${timeout}ms`)
                /**
                 * Not a WebDriver error name on purpose: for `stale element
                 * reference` and `element not interactable` WebdriverIO
                 * waits a second time.
                 */
                error.name = 'MobilecliTimeoutError'
                throw error
            }
            await sleep(interval)
        }
        seen = null
    }
}

export function waitForVisible (session: Session, elementId: string) {
    return waitFor(session, elementId, 'visible')
}

export function waitForActionable (session: Session, elementId: string) {
    return waitFor(session, elementId, 'actionable')
}

/**
 * Tap in the middle of an element (`device.io.tap`). mobilecli taps on a
 * place on the screen and only takes whole numbers.
 */
export async function tapNode (session: Session, { rect }: TreeNode) {
    await act(session, 'device.io.tap', {
        x: Math.round(rect.x + rect.width / 2),
        y: Math.round(rect.y + rect.height / 2)
    })
}

/**
 * Wait until an element can be used and tap it. It is
 * `locator._resolveAndTap()` of Mobilewright.
 */
export async function tapElement (session: Session, elementId: string) {
    await tapNode(session, await waitForActionable(session, elementId))
}

/**
 * Give an element the focus for `device.io.fill`, which fills the field
 * that has the focus: wait until the element can be used, and tap it if it
 * does not have the focus yet.
 *
 * Mobilewright always taps (`locator._resolveAndTap()`). The driver does
 * not tap an element that has the focus, because of iOS: a tap on a field
 * that has the focus and text opens the edit menu (Select All, Paste), the
 * field loses the focus, and the fill after it changes nothing. Measured on
 * the iOS 27 simulator: a second fill of the same field, 2 s after the
 * first, kept the old text in 3 of 4 tries with the tap and in 0 of 4
 * without it.
 */
export async function focusForFill (session: Session, elementId: string) {
    const node = await waitForActionable(session, elementId)
    if (node.focused !== true) {
        await tapNode(session, node)
    }
}

/**
 * Give an element the focus for `device.io.text`, which types into the
 * field that has the focus. Mobilewright has no counterpart: its `fill()`
 * uses `device.io.fill`, which does not need this.
 * - an element that has the focus is not tapped, so the cursor stays where
 *   it is
 * - else it is tapped, and the driver waits until the UI tree says that the
 *   element has the focus: a field only has it some time after the tap,
 *   and text that is sent right away is lost. Not every element says so:
 *   after `focusTimeout` the driver goes on.
 */
export async function focusElement (session: Session, elementId: string) {
    const { interval } = session.wait
    const { focusTimeout } = session.settings
    const node = await waitForActionable(session, elementId)
    if (node.focused === true) {
        return
    }

    await tapNode(session, node)

    const deadline = Date.now() + focusTimeout
    while (Date.now() < deadline) {
        if ((await getNode(session, elementId))?.focused === true) {
            return
        }
        await sleep(interval)
    }
    log.debug(`The element ${elementId} did not get the focus within ${focusTimeout}ms after the tap`)
}
