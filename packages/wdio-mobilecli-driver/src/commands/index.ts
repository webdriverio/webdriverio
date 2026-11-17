import logger from '@wdio/logger'
import { commandCallStructure } from '@wdio/utils'
import { WebDriverProtocol, AppiumProtocol, type Protocol } from '@wdio/protocols'

import { PACKAGE_NAME } from '../constants.js'
import { getWaitOptions } from '../settings.js'
import type { Session } from '../types.js'

import { deleteSession } from './browser/deleteSession.js'
import { findElement } from './browser/findElement.js'
import { findElements } from './browser/findElements.js'
import { getPageSource } from './browser/getPageSource.js'
import { getTimeouts } from './browser/getTimeouts.js'
import { hideKeyboard } from './browser/hideKeyboard.js'
import { isKeyboardShown } from './browser/isKeyboardShown.js'
import { getWindowHandle } from './browser/getWindowHandle.js'
import { setTimeouts } from './browser/setTimeouts.js'
import { elementClear } from './element/elementClear.js'
import { elementClick } from './element/elementClick.js'
import { elementSendKeys } from './element/elementSendKeys.js'
import { getElementProperty } from './element/getElementProperty.js'
import { getElementText } from './element/getElementText.js'
import { isElementDisplayed } from './element/isElementDisplayed.js'
import { isElementEnabled } from './element/isElementEnabled.js'
import { setElementValue } from './element/setElementValue.js'

const log = logger(PACKAGE_NAME)

/**
 * what a protocol command of the driver is called with as `this`
 */
interface Client {
    emit (event: string, payload: unknown): void
    options?: object
}

/**
 * an element of WebdriverIO
 */
interface ApiElement extends Client {
    elementId: string
    click (): Promise<void>
    waitForExist (): Promise<unknown>
}

type ApiCommand = (this: ApiElement, original: unknown, ...args: unknown[]) => Promise<unknown>

/**
 * a client that WebdriverIO commands can be changed on
 */
interface CommandClient {
    overwriteCommand (name: string, func: ApiCommand, options: { attachToElement: boolean }): void
}

/**
 * Commands of the WebdriverIO API that the driver gives its own meaning,
 * because WebdriverIO sends them in a way that is made for Appium. Only
 * these two: a command that is replaced does not get the wait of
 * WebdriverIO for an element that is not on the screen yet, so every other
 * command stays the one of WebdriverIO.
 * - `$(selector).tap()` is `$(selector).click()`: mobilecli only has a tap.
 *   WebdriverIO sends its own `tap()` as an Appium script (`mobile: tap`).
 * - `$(selector).setValue(text)` is one `setElementValue`, in place of
 *   `elementClear` and `elementSendKeys`. It is not a command of the
 *   session, so a test can not call it on its own.
 */
export function getApiCommands (session: Session): Record<string, ApiCommand> {
    const fill = wrapCommand(session, 'setElementValue', setElementValue)

    return {
        tap () {
            return this.click()
        },
        async setValue (_original, value) {
            if (typeof value !== 'string' && typeof value !== 'number') {
                throw new Error('The setValue command only takes string or number values.')
            }
            /**
             * A replaced command does not get the wait of WebdriverIO for an
             * element that is not on the screen yet. The wait command finds
             * it and gives the element its id.
             */
            if (!this.elementId) {
                await this.waitForExist()
            }
            return fill.call(this, this.elementId, String(value))
        }
    }
}

export function addElementCommands<T> (client: T, session: Session): T {
    for (const [name, command] of Object.entries(getApiCommands(session))) {
        (client as CommandClient).overwriteCommand(name, command, { attachToElement: true })
    }
    return client
}

/**
 * A command of the driver: it gets the session, and then the parameters of
 * the WebDriver or Appium command it has the name of. That is what the
 * WebdriverIO commands (`$`, `click`, ...) call.
 */
type Command = (session: Session, ...args: never[]) => Promise<unknown>

/**
 * The commands that the driver implements, split the way WebdriverIO splits
 * its own commands.
 * - browser commands are about the device and its screen
 * - element commands get the id of an element as their first parameter
 */
export const BROWSER_COMMANDS: Record<string, Command> = {
    deleteSession,
    findElement,
    findElements,
    getPageSource,
    getTimeouts,
    getWindowHandle,
    hideKeyboard,
    isKeyboardShown,
    setTimeouts
}

export const ELEMENT_COMMANDS: Record<string, Command> = {
    elementClear,
    elementClick,
    elementSendKeys,
    getElementProperty,
    getElementText,
    isElementDisplayed,
    isElementEnabled
}

/**
 * the names of all WebDriver and Appium commands
 */
function getProtocolCommandNames () {
    const names = new Set<string>()
    for (const protocol of [WebDriverProtocol, AppiumProtocol] as Protocol[]) {
        for (const methods of Object.values(protocol)) {
            for (const endpoint of Object.values(methods)) {
                names.add(endpoint.command)
            }
        }
    }
    return names
}

/**
 * The prototype of a session: the commands of the driver, and for every
 * other WebDriver or Appium command a function that says that the driver
 * does not support it. Without it WebdriverIO fails with
 * "this.<command> is not a function".
 */
export function getProtocolCommands (session: Session): PropertyDescriptorMap {
    const prototype: PropertyDescriptorMap = {}

    for (const name of getProtocolCommandNames()) {
        prototype[name] = {
            value: wrapCommand(session, name, async () => {
                throw new Error(`The command "${name}" is not supported by ${PACKAGE_NAME}`)
            })
        }
    }
    for (const [name, command] of Object.entries({ ...BROWSER_COMMANDS, ...ELEMENT_COMMANDS })) {
        prototype[name] = { value: wrapCommand(session, name, command) }
    }

    return prototype
}

/**
 * Log a command and tell the listeners of the client about it, the way the
 * `webdriver` package does. Reporters and services listen to these events.
 */
function wrapCommand (session: Session, name: string, command: Command) {
    return async function (this: Client, ...args: unknown[]) {
        const event = { command: name, method: 'POST', endpoint: session.rpc.url, body: { args } }

        try {
            if (session.ended) {
                throw new Error(`Can not run "${name}": the session ${session.id} has ended`)
            }

            session.wait = getWaitOptions(session, this.options)
            log.info('COMMAND', commandCallStructure(name, args))
            this.emit('command', event)
            const value = await command(session, ...args as never[])
            log.info('RESULT', value)
            this.emit('result', { ...event, result: { value } })
            return value
        } catch (error) {
            this.emit('result', { ...event, result: { error } })
            throw error
        }
    }
}
