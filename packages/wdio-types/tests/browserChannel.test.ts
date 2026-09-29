import { describe, expect, it } from 'vitest'

import {
    MESSAGE_TYPES,
    browserChannelMessage,
    isBrowserChannelMessage,
    isWorkerProcessEvent,
    parseBrowserToRunnerMessage,
    parseRunnerToBrowserMessage,
    routeBrowserToRunnerMessage,
    workerProcessEvent,
} from '../src/BrowserChannel.js'

const consoleMessage = browserChannelMessage(MESSAGE_TYPES.consoleMessage, {
    name: 'consoleEvent',
    type: 'log',
    args: ['hello'],
    cid: '0-0'
})

const commandRequest = browserChannelMessage(MESSAGE_TYPES.commandRequestMessage, {
    id: 1,
    cid: '0-0',
    commandName: 'url',
    args: ['/']
})

describe('browser channel messages', () => {
    it('keeps the historic numeric discriminants', () => {
        expect(MESSAGE_TYPES.consoleMessage).toBe(0)
        expect(MESSAGE_TYPES.commandRequestMessage).toBe(1)
        expect(MESSAGE_TYPES.commandResponseMessage).toBe(2)
        expect(MESSAGE_TYPES.coverageMap).toBe(9)
        expect(MESSAGE_TYPES.customCommand).toBe(10)
        expect(MESSAGE_TYPES.browserTestResult).toBe(13)
    })

    it('builds a message whose value matches the type', () => {
        expect(consoleMessage).toEqual({
            type: MESSAGE_TYPES.consoleMessage,
            value: { name: 'consoleEvent', type: 'log', args: ['hello'], cid: '0-0' }
        })
        expect(isBrowserChannelMessage(consoleMessage, MESSAGE_TYPES.consoleMessage)).toBe(true)
        expect(isBrowserChannelMessage(consoleMessage, MESSAGE_TYPES.commandRequestMessage)).toBe(false)
    })

    it('parses browser → runner payloads and rejects the other direction', () => {
        expect(parseBrowserToRunnerMessage(commandRequest)).toEqual(commandRequest)
        expect(parseBrowserToRunnerMessage({
            type: MESSAGE_TYPES.commandResponseMessage,
            value: { id: 1, result: 'ok' }
        })).toBeUndefined()
        expect(parseBrowserToRunnerMessage({
            type: MESSAGE_TYPES.coverageMap,
            value: {}
        })).toBeUndefined()
        expect(parseBrowserToRunnerMessage({ type: 'commandRequestMessage' })).toBeUndefined()
        expect(parseBrowserToRunnerMessage(null)).toBeUndefined()
        expect(parseBrowserToRunnerMessage({
            type: MESSAGE_TYPES.commandRequestMessage,
            value: { id: 1, commandName: 'url', args: [] }
        })).toBeUndefined()
    })

    it('accepts an empty expect-matchers request object', () => {
        const message = browserChannelMessage(MESSAGE_TYPES.expectMatchersRequest, {})
        expect(parseBrowserToRunnerMessage(message)).toEqual(message)
        expect(parseBrowserToRunnerMessage({
            type: MESSAGE_TYPES.expectMatchersRequest
        })).toBeUndefined()
    })

    it('parses runner → browser payloads', () => {
        const response = browserChannelMessage(MESSAGE_TYPES.expectResponseMessage, {
            id: 4,
            pass: false,
            message: 'nope'
        })
        expect(parseRunnerToBrowserMessage(response)).toEqual(response)
        expect(parseRunnerToBrowserMessage(commandRequest)).toBeUndefined()
        expect(parseRunnerToBrowserMessage({
            type: MESSAGE_TYPES.expectMatchersResponse,
            value: { matchers: ['toBeDisplayed', 1] }
        })).toBeUndefined()
    })

    it('routes requests, one-way events, and local browser-state lookups', () => {
        const hook = browserChannelMessage(MESSAGE_TYPES.hookTriggerMessage, { id: 1, cid: '0-0', name: 'before', args: [] })
        const expectRequest = browserChannelMessage(MESSAGE_TYPES.expectRequestMessage, {
            id: 1,
            cid: '0-0',
            matcherName: 'toExist',
            args: [],
            scope: {}
        })
        const matchersRequest = browserChannelMessage(MESSAGE_TYPES.expectMatchersRequest, { cid: '0-0' })
        const testResult = browserChannelMessage(MESSAGE_TYPES.browserTestResult, { failures: 0, events: [] })

        expect(routeBrowserToRunnerMessage(commandRequest)).toEqual({ kind: 'request', message: commandRequest })
        expect(routeBrowserToRunnerMessage(hook)).toEqual({ kind: 'request', message: hook })
        expect(routeBrowserToRunnerMessage(expectRequest)).toEqual({ kind: 'request', message: expectRequest })
        expect(routeBrowserToRunnerMessage(matchersRequest)).toEqual({ kind: 'request', message: matchersRequest })
        expect(routeBrowserToRunnerMessage(consoleMessage)).toEqual({ kind: 'event', message: consoleMessage })
        expect(routeBrowserToRunnerMessage(testResult)).toEqual({ kind: 'event', message: testResult })
        expect(routeBrowserToRunnerMessage(browserChannelMessage(MESSAGE_TYPES.initiateBrowserStateRequest, { cid: '0-1' })))
            .toEqual({ kind: 'browserState', cid: '0-1' })
        expect(routeBrowserToRunnerMessage({ type: 'foobar' })).toEqual({ kind: 'drop' })
        expect(routeBrowserToRunnerMessage(workerProcessEvent(MESSAGE_TYPES.customCommand, {
            commandName: 'foo',
            cid: '0-0'
        }))).toEqual({ kind: 'drop' })
    })

    it('distinguishes worker process events from browser channel messages', () => {
        const event = workerProcessEvent(MESSAGE_TYPES.customCommand, { commandName: 'foo', cid: '0-0' })
        expect(isWorkerProcessEvent(event, MESSAGE_TYPES.customCommand)).toBe(true)
        expect(isWorkerProcessEvent(event, MESSAGE_TYPES.coverageMap)).toBe(false)
        expect(isWorkerProcessEvent(commandRequest, MESSAGE_TYPES.customCommand)).toBe(false)
    })
})
