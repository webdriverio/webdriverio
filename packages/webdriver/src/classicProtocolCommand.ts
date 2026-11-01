import { WebDriverProtocol, type Protocol } from '@wdio/protocols'

import command from './command.js'
import type { BaseClient } from './types.js'

const protocol = WebDriverProtocol as Protocol

/**
 * Classic endpoints of commands that WebdriverIO installs with the same name
 * (`back`, `forward`, `closeWindow`): calling `this.back()` from those commands
 * would recurse. `browser.url()` can call `this.navigateTo()` because the names differ.
 */
const CLASSIC_PROTOCOL_COMMANDS = {
    back: {
        method: 'POST',
        endpoint: '/session/:sessionId/back'
    },
    forward: {
        method: 'POST',
        endpoint: '/session/:sessionId/forward'
    },
    closeWindow: {
        method: 'DELETE',
        endpoint: '/session/:sessionId/window'
    }
} as const

export type ClassicProtocolCommand = keyof typeof CLASSIC_PROTOCOL_COMMANDS
export type ClassicHistoryCommand = Extract<ClassicProtocolCommand, 'back' | 'forward'>

/**
 * Run a classic WebDriver command by name and return its value.
 *
 * The HTTP request is built from the protocol definition, not from the
 * instance method. A BiDi session whose connection is down (`isBidi === false`)
 * still posts to `POST /session/:sessionId/back` or `.../forward`.
 */
export async function runClassicProtocolCommand (
    this: Pick<BaseClient, 'sessionId' | 'options' | 'capabilities' | 'isSeleniumStandalone'>,
    commandName: ClassicProtocolCommand
): Promise<unknown> {
    const definition = CLASSIC_PROTOCOL_COMMANDS[commandName]
    if (!definition) {
        throw new Error(`Unknown classic protocol command "${String(commandName)}"`)
    }

    const commandInfo = protocol[definition.endpoint]?.[definition.method]
    if (!commandInfo || commandInfo.command !== commandName) {
        throw new Error(`Classic protocol command "${commandName}" is not defined`)
    }

    const run = command(
        definition.method,
        definition.endpoint,
        commandInfo,
        Boolean(this.isSeleniumStandalone)
    )
    return run.call(this as BaseClient)
}
