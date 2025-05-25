import type { Event } from '../Runner.js'
import type { $, $$ } from '@wdio/globals'

export enum WS_MESSAGE_TYPES {
    consoleMessage = 200,
    commandRequestMessage,
    commandResponseMessage,
    hookTriggerMessage,
    hookResultMessage,
    expectRequestMessage,
    expectResponseMessage,
    expectMatchersRequest,
    expectMatchersResponse,
    coverageMap,
    customCommand,
    initiateBrowserStateRequest,
    initiateBrowserStateResponse,
    browserTestResult,
    workerResponseMessage
}

export type WSMessageValue = {
    [WS_MESSAGE_TYPES.consoleMessage]: ConsoleEvent
    [WS_MESSAGE_TYPES.commandRequestMessage]: CommandRequestEvent
    [WS_MESSAGE_TYPES.commandResponseMessage]: CommandResponseEvent
    [WS_MESSAGE_TYPES.hookTriggerMessage]: HookTriggerEvent
    [WS_MESSAGE_TYPES.hookResultMessage]: HookResultEvent
    [WS_MESSAGE_TYPES.expectRequestMessage]: ExpectRequestEvent
    [WS_MESSAGE_TYPES.expectResponseMessage]: ExpectResponseEvent
    [WS_MESSAGE_TYPES.expectMatchersRequest]: never
    [WS_MESSAGE_TYPES.expectMatchersResponse]: ExpectMatchersResponse
    [WS_MESSAGE_TYPES.coverageMap]: CoverageMapData
    [WS_MESSAGE_TYPES.customCommand]: CustomCommandEvent
    [WS_MESSAGE_TYPES.initiateBrowserStateRequest]: BrowserStateRequest
    [WS_MESSAGE_TYPES.initiateBrowserStateResponse]: BrowserState
    [WS_MESSAGE_TYPES.browserTestResult]: BrowserTestResults
    [WS_MESSAGE_TYPES.workerResponseMessage]: WorkerResponseMessage
}

export type WSMessage<T extends WS_MESSAGE_TYPES> = {
    type: T
    value: WSMessageValue[T]
}

export type AnyWSMessage = WSMessage<WS_MESSAGE_TYPES>

import type { CoverageMapData } from 'istanbul-lib-coverage'

// Placeholder type declarations – replace with actual imports
interface ConsoleEvent {
    name: 'consoleEvent'
    type: 'log' | 'info' | 'warn' | 'debug' | 'error'
    args: unknown[]
    cid: string
}

interface CommandRequestEvent {
    id: number;
    cid: string;
    commandName: string;
    args: unknown[];
    scope?: string
}

interface CommandResponseEvent {
    id: number;
    result?: unknown;
    error?: Error
}

interface HookTriggerEvent {
    id: number;
    cid: string;
    name: string;
    args: unknown[]
}

interface HookResultEvent {
    id: number;
    error?: Error
}

interface ExpectRequestEvent {
    id: number
    cid: string
    matcherName: string
    scope: unknown
    args: unknown[]
    element?: ReturnType<typeof $> | ReturnType<typeof $$>[number] | undefined
    context?: 'WebdriverIO.Element' | 'WebdriverIO.Browser' | string
    errorStack?: string
}

interface ExpectResponseEvent {
    id: number;
    pass: boolean;
    message: string
}

interface ExpectMatchersResponse {
    matchers: string[]
}

interface CustomCommandEvent {
    commandName: string;
    cid: string
}

interface BrowserStateRequest {
    cid: string
}

interface BrowserState {
    customCommands: string[]
}
interface BrowserTestResults {
    failures: number
    events: Event[]
}

export interface WorkerResponseMessage {
    origin: string
    name: string
    args: {
        id: number
        message: AnyWSMessage
    }
}

