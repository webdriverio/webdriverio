import { expectTypeOf, test } from 'vitest'

import {
    MESSAGE_TYPES,
    browserChannelMessage,
    type AnyBrowserToRunnerMessage,
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
})
