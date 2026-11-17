import { DEFAULT_SETTINGS } from '../../src/constants.js'
import { ElementRegistry } from '../../src/elements.js'
import { RpcClient } from '../../src/rpc.js'
import type { Session, Settings } from '../../src/types.js'
import type { TreeNode } from '../../src/tree.js'
import { findElement } from '../../src/commands/browser/findElement.js'
import { IOS_DEVICE, getRequests, mockServer } from './server.js'

export const ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'

/**
 * a session on a device, as `newSession` makes it
 */
export function createSession (device = IOS_DEVICE, wait = { timeout: 5000, interval: 100 }, settings: Partial<Settings> = {}): Session {
    return {
        id: 'session-1',
        rpc: new RpcClient('http://localhost:12000/rpc'),
        device,
        timeouts: {},
        settings: { ...DEFAULT_SETTINGS, ...settings },
        wait,
        elements: new ElementRegistry(),
        ended: false
    }
}

/**
 * a session whose commands look at the screen once and do not wait
 */
export const NO_WAIT = { timeout: 0, interval: 1 }

/**
 * A server with a screen that can change between two commands: set
 * `screen.tree`. Without a tree the screen is empty.
 */
export function mockScreen (tree?: TreeNode[]) {
    const screen = { tree }
    const fetchMock = mockServer({
        'device.dump.ui': () => (screen.tree ? { elements: screen.tree } : {}),
        'device.io.tap': () => undefined
    })
    return { screen, fetchMock }
}

/**
 * The id of the first element that a selector matches.
 * @param justNow  The command under test comes right after the find, as in
 *                 a WebdriverIO test, and can use what the find saw. Without
 *                 it the find was some time ago and the command has to look
 *                 at the screen itself.
 */
export async function findElementId (session: Session, using: string, value: string, { justNow = false } = {}) {
    const element = await findElement(session, using, value) as Record<string, string>
    if (!justNow) {
        session.elements.forgetObservations()
        session.lastDump = undefined
    }
    return element[ELEMENT_KEY]
}

/**
 * the methods that were sent to the server, without `device.`
 */
export function getMethods (fetchMock: ReturnType<typeof mockServer>) {
    return getRequests(fetchMock).map(({ method }) => method.replace('device.', ''))
}

/**
 * the taps that were sent to the server
 */
export function getTaps (fetchMock: ReturnType<typeof mockServer>) {
    return getRequests(fetchMock).filter(({ method }) => method === 'device.io.tap').map(({ params }) => params)
}

/**
 * a text field without the focus
 */
export const INPUT: TreeNode = {
    ref: '@e1',
    type: 'TextField',
    name: 'text-input',
    identifier: 'text-input',
    placeholder: 'Type something',
    rect: { x: 50, y: 204, width: 302, height: 40 }
}

/**
 * A server with a screen that has one text field. A tap gives it the focus
 * after `focusAfter` more looks at the screen, never if it is not set.
 */
export function mockInput ({ focused = false, focusAfter }: { focused?: boolean, focusAfter?: number } = {}) {
    const state = { focused, dumpsUntilFocus: undefined as number | undefined }
    return mockServer({
        'device.dump.ui': () => {
            if (state.dumpsUntilFocus !== undefined && state.dumpsUntilFocus-- <= 0) {
                state.focused = true
            }
            return { elements: [{ ...INPUT, ...(state.focused ? { focused: true } : {}) }] }
        },
        'device.io.tap': () => {
            state.dumpsUntilFocus = focusAfter
        },
        'device.io.fill': () => undefined,
        'device.io.text': () => undefined
    })
}
