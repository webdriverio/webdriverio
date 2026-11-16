import logger from '@wdio/logger'
import { commandCallStructure } from '@wdio/utils'
import { WebDriverProtocol, AppiumProtocol, type Protocol } from '@wdio/protocols'

import { NATIVE_CONTEXT, PACKAGE_NAME } from './constants.js'
import type { Session, Timeouts } from './types.js'

const log = logger('@wdio/mobilecli-driver')

/**
 * what a protocol command of the driver is called with as `this`
 */
interface Client {
    emit (event: string, payload: unknown): void
}

type Command = (this: Client, ...args: never[]) => Promise<unknown>

/**
 * The protocol commands that the driver implements for a session. They have
 * the names and the parameters of the WebDriver and Appium commands, as that
 * is what the WebdriverIO commands (`$`, `click`, ...) call.
 */
function getSessionCommands (session: Session): Record<string, Command> {
    return {
        /**
         * End the session. mobilecli has no session to end: the device, the
         * app and the server keep running.
         */
        async deleteSession () {
            session.ended = true
            return null
        },

        /**
         * mobilecli has no windows, WebdriverIO asks for the handle when the
         * session starts
         */
        async getWindowHandle () {
            return NATIVE_CONTEXT
        },

        async getTimeouts () {
            return { ...session.timeouts }
        },

        /**
         * mobilecli has no timeouts, the values are only remembered
         */
        async setTimeouts (implicit?: number, pageLoad?: number, script?: number) {
            const timeouts: Timeouts = { implicit, pageLoad, script }
            for (const [name, value] of Object.entries(timeouts) as [keyof Timeouts, number | undefined][]) {
                if (value !== undefined) {
                    session.timeouts[name] = value
                }
            }
            return null
        }
    }
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
    const commands = getSessionCommands(session)
    const prototype: PropertyDescriptorMap = {}

    for (const name of getProtocolCommandNames()) {
        prototype[name] = {
            value: wrapCommand(session, name, async () => {
                throw new Error(`The command "${name}" is not supported by ${PACKAGE_NAME}`)
            })
        }
    }
    for (const [name, command] of Object.entries(commands)) {
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

            log.info('COMMAND', commandCallStructure(name, args))
            this.emit('command', event)
            const value = await command.apply(this, args as never[])
            log.info('RESULT', value)
            this.emit('result', { ...event, result: { value } })
            return value
        } catch (error) {
            this.emit('result', { ...event, result: { error } })
            throw error
        }
    }
}
