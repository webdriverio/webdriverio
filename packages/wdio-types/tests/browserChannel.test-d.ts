import { expectTypeOf, test } from 'vitest'

import type { Workers } from '../src/index.js'
import {
    MESSAGE_TYPES,
    browserChannelMessage,
    type AnyBrowserToRunnerMessage,
    type CoverageMapPayload,
    type SocketMessage,
    type SocketMessagePayload,
    type SocketMessageValue,
} from '../src/BrowserChannel.js'

test('narrows a browser channel message to its value', () => {
    const message = browserChannelMessage(MESSAGE_TYPES.consoleMessage, {
        name: 'consoleEvent',
        type: 'log',
        args: ['hello'],
        cid: '0-0'
    })
    expectTypeOf(message.value.cid).toEqualTypeOf<string>()
    expectTypeOf(message.value.type).toEqualTypeOf<'log' | 'info' | 'warn' | 'debug' | 'error'>()

    const incoming = browserChannelMessage(MESSAGE_TYPES.commandRequestMessage, {
        id: 1,
        cid: '0-0',
        commandName: 'url',
        args: ['/']
    }) as AnyBrowserToRunnerMessage
    if (incoming.type === MESSAGE_TYPES.commandRequestMessage) {
        expectTypeOf(incoming.value.commandName).toEqualTypeOf<string>()
        expectTypeOf(incoming.value.args).toEqualTypeOf<unknown[]>()
    }
})

test('keeps worker process events off the browser channel', () => {
    const incoming = null as unknown as AnyBrowserToRunnerMessage
    if (incoming.type === MESSAGE_TYPES.consoleMessage) {
        expectTypeOf(incoming.value.name).toEqualTypeOf<'consoleEvent'>()
    }

    // @ts-expect-error coverageMap is a worker process event, not a browser → runner message
    browserChannelMessage(MESSAGE_TYPES.coverageMap, {})

    type CoverageValue = SocketMessageValue[typeof MESSAGE_TYPES.coverageMap]
    expectTypeOf<CoverageValue>().toEqualTypeOf<CoverageMapPayload>()

    type ConsolePayload = SocketMessagePayload<typeof MESSAGE_TYPES.consoleMessage>
    expectTypeOf<ConsolePayload['value']['cid']>().toEqualTypeOf<string>()

    const historical = null as unknown as SocketMessage
    if (historical.type === MESSAGE_TYPES.customCommand) {
        expectTypeOf(historical.value.commandName).toEqualTypeOf<string>()
    }

    type NamespacedPayload = Workers.SocketMessagePayload<typeof MESSAGE_TYPES.hookTriggerMessage>
    expectTypeOf<NamespacedPayload['value']['name']>().toEqualTypeOf<string>()
    type NamespacedValue = Workers.SocketMessageValue[typeof MESSAGE_TYPES.customCommand]
    expectTypeOf<NamespacedValue['cid']>().toEqualTypeOf<string>()
})

test('preserves custom-command scope in browser state and worker events', () => {
    const state = browserChannelMessage(MESSAGE_TYPES.initiateBrowserStateResponse, {
        customCommands: [
            { commandName: 'sharedName', attachToElement: false },
            { commandName: 'sharedName', attachToElement: true }
        ]
    })
    expectTypeOf(state.value.customCommands[0].attachToElement).toEqualTypeOf<boolean>()
    const workerEvent: Workers.CustomCommandEvent = { commandName: 'sharedName', cid: '0-0', attachToElement: true }
    expectTypeOf(workerEvent.attachToElement).toEqualTypeOf<boolean | undefined>()
    const legacyBrowserEvent: Workers.CustomCommandEvent = { commandName: 'browserOnly', cid: '0-0' }
    expectTypeOf(legacyBrowserEvent.commandName).toEqualTypeOf<string>()

    // @ts-expect-error browser state requires explicit command scope
    browserChannelMessage(MESSAGE_TYPES.initiateBrowserStateResponse, { customCommands: [{ commandName: 'missingScope' }] })
    // @ts-expect-error scope is a boolean, not a string
    browserChannelMessage(MESSAGE_TYPES.initiateBrowserStateResponse, { customCommands: [{ commandName: 'wrongScope', attachToElement: 'true' }] })
})
