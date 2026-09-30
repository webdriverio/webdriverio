import { WebDriverProtocol, type Protocol } from '@wdio/protocols'

import command from './command.js'
import type { BaseClient } from './types.js'

const protocol = WebDriverProtocol as Protocol

/**
 * Classic history endpoints. WebdriverIO installs its own `back` and `forward`
 * on the session, so calling `this.back()` from those commands would recurse.
 * `browser.url()` can call `this.navigateTo()` because the names differ.
 */
const CLASSIC_HISTORY_COMMANDS = {
    back: {
        method: 'POST',
        endpoint: '/session/:sessionId/back'
    },
    forward: {
        method: 'POST',
        endpoint: '/session/:sessionId/forward'
    }
} as const

export type ClassicHistoryCommand = keyof typeof CLASSIC_HISTORY_COMMANDS

/**
 * Run the classic WebDriver `back` or `forward` command by name.
 *
 * The HTTP request is built from the protocol definition, not from the
 * instance method. A BiDi session whose connection is down (`isBidi === false`)
 * still posts to `POST /session/:sessionId/back` or `.../forward`.
 */
export async function runClassicProtocolCommand (
    this: Pick<BaseClient, 'sessionId' | 'options' | 'capabilities' | 'isSeleniumStandalone'> & Pick<BaseClient, 'emit' | 'on' | 'off'>,
    commandName: ClassicHistoryCommand
): Promise<void> {
    const definition = CLASSIC_HISTORY_COMMANDS[commandName]
    if (!definition) {
        throw new Error(`Unknown classic protocol command "${String(commandName)}"`)
    }

    const commandInfo = protocol[definition.endpoint]?.POST
    if (!commandInfo || commandInfo.command !== commandName) {
        throw new Error(`Classic protocol command "${commandName}" is not defined`)
    }

    const run = command(
        definition.method,
        definition.endpoint,
        commandInfo,
        Boolean(this.isSeleniumStandalone)
    )
    await run.call(this as BaseClient)
}
