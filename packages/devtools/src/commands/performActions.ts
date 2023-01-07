import type { KeyInput } from 'puppeteer-core/lib/esm/puppeteer/common/USKeyboardLayout.js'
import { _keyDefinitions } from 'puppeteer-core/lib/esm/puppeteer/common/USKeyboardLayout.js'
import type { Keyboard, Mouse } from 'puppeteer-core/lib/esm/puppeteer/common/Input.js'

import getElementRect from './getElementRect.js'
import getWindowRect from './getWindowRect.js'
import { ELEMENT_KEY, UNICODE_CHARACTERS } from '../constants.js'
import { sleep } from '../utils.js'
import type DevToolsDriver from '../devtoolsdriver.js'

const KEY = 'key'
const POINTER = 'pointer'

interface Action {
    duration?: number
    type: string
    value?: string
    x?: number
    y?: number
    deltaX?: number
    deltaY?: number
    button?: number
    origin?: any
}

interface ActionsParameter {
    type?: string
    actions: Action[]
    parameters?: {
        pointerType?: string
    }
}

/**
 * The Perform Actions command is used to execute complex user actions.
 * See [spec](https://github.com/jlipps/simple-wd-spec#perform-actions) for more details.
 *
 * @alias browser.performActions
 * @see https://w3c.github.io/webdriver/#dfn-perform-actions
 * @param {object[]} actions  A list of objects, each of which represents an input source and its associated actions.
 */
export default async function performActions(
    this: DevToolsDriver,
    { actions }: { actions: ActionsParameter[] }
) {
    const page = this.getPageHandle()
    const lastPointer: {
        x?: number,
        y?: number
    } = {}

    /**
     * see https://github.com/jlipps/simple-wd-spec#input-sources-and-corresponding-actions
     * for details on the `actions` format
     */
    for (const action of actions) {
        if (action.type === null || action.type === 'null') {
            for (const singleAction of action.actions) {
                await sleep(singleAction.duration)
            }
            continue
        }

        if (action.type === 'key') {
            const skipChars = []
            for (const singleAction of action.actions) {
                if (singleAction.type === 'pause') {
                    await sleep(singleAction.duration)
                    continue
                }

                const cmd = singleAction.type.slice(KEY.length).toLowerCase() as keyof Keyboard
                const keyboardFn = (page.keyboard[cmd] as Function).bind(page.keyboard)

                /**
                 * skip up event as we had to use sendCharacter for non unicode
                 * characters which includes the up event already
                 */
                if (cmd === 'up' && skipChars[0] === singleAction.value) {
                    skipChars.shift()
                    continue
                }

                /**
                 * for special characters like emojis 😉 we need to
                 * send in the value as text because it is not unicode
                 */
                const [key] = (Object.entries(UNICODE_CHARACTERS)
                    .find(([, charValue]) => charValue === singleAction.value) || []) as [KeyInput | undefined, never]
                const pptrKey = key && _keyDefinitions[key]
                    ? key
                    : _keyDefinitions[singleAction.value as unknown as KeyInput]
                        ? singleAction.value as KeyInput
                        : undefined
                if (!pptrKey) {
                    await page.keyboard.sendCharacter(singleAction.value as unknown as KeyInput)
                    skipChars.push(singleAction.value)
                    continue
                }

                await keyboardFn(pptrKey)
                continue
            }
            continue
        }

        if (action.type === 'pointer') {
            if (action.parameters && action.parameters.pointerType && action.parameters.pointerType !== 'mouse') {
                throw new Error('Currently only "mouse" is supported as pointer type')
            }

            /**
             * detect double click
             */
            if (
                action.actions.length === 6 &&
                action.actions[0].type === 'pointerMove' &&
                action.actions[1].type === 'pointerDown' &&
                action.actions[2].type === 'pointerUp' &&
                action.actions[3].type === 'pause' &&
                action.actions[4].type === 'pointerDown' &&
                action.actions[5].type === 'pointerUp'
            ) {
                let x = action.actions[0].x || 0
                let y = action.actions[0].y || 0
                if (action.actions[0].origin) {
                    const location = await getElementRect.call(this, { elementId: action.actions[0].origin[ELEMENT_KEY] })
                    x += location.x + (location.width / 2)
                    y += location.y + (location.height / 2)
                }

                await page.mouse.click(x, y, { clickCount: 2 })
                continue
            }

            for (const singleAction of action.actions) {
                if (singleAction.type === 'pause') {
                    await sleep(singleAction.duration)
                    continue
                }

                const cmd = singleAction.type.slice(POINTER.length).toLowerCase()
                const keyboardFn = (page.mouse[cmd as keyof Mouse] as Function).bind(page.mouse)
                const { duration, button, origin } = singleAction

                let { x, y } = singleAction
                if (cmd === 'move') {
                    /**
                     * set location relative from last position if origin is set to pointer
                     */
                    if (
                        typeof x === 'number' &&
                        typeof y === 'number' &&
                        origin === 'pointer' &&
                        lastPointer.x && lastPointer.y
                    ) {
                        x += lastPointer.x
                        y += lastPointer.y
                    }

                    /**
                     * set location relative from an element
                     */
                    if (origin && typeof origin[ELEMENT_KEY] === 'string' && typeof x === 'number' && typeof y === 'number') {
                        const elemRect = await getElementRect.call(this, { elementId: origin[ELEMENT_KEY] })
                        x += elemRect.x + (elemRect.width / 2)
                        y += elemRect.y + (elemRect.height / 2)
                    }

                    lastPointer.x = x
                    lastPointer.y = y
                    await keyboardFn(x, y, { steps: 10 })
                    continue
                } else {
                    /**
                     * "left" is default button
                     * "1": middle, "2": right
                     */
                    const pptrButton = (
                        button === 1 ? 'middle' : (
                            button === 2 ? 'right' : 'left'
                        )
                    )
                    await keyboardFn({ button: pptrButton })
                }

                if (duration) {
                    await sleep(duration)
                }
                continue
            }
            continue
        }

        if (action.type === 'wheel') {
            for (const singleAction of action.actions) {
                const deltaX = singleAction.deltaX || 0
                const deltaY = singleAction.deltaY || 0

                if (singleAction.origin) {
                    const windowSize = await getWindowRect.call(this)
                    const location = await getElementRect.call(this, { elementId: singleAction.origin[ELEMENT_KEY] })
                    await page.mouse.wheel({
                        deltaX: location.x + deltaX,
                        deltaY: location.y - windowSize.height + deltaY
                    })
                } else if (singleAction.x || singleAction.y) {
                    await page.mouse.wheel({
                        deltaX: (singleAction.x || 0) + deltaX,
                        deltaY: (singleAction.y || 0) + deltaY
                    })
                } else {
                    await page.mouse.wheel({ deltaX, deltaY })
                }
            }
            continue
        }

        throw new Error(`Unknown action type ("${action.type}"), allowed are only: null, key and pointer`)
    }
}
