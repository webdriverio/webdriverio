import type { EventEmitter } from 'events'

import type { SessionFlags } from 'webdriver'
import type { Options, Capabilities, FunctionProperties, ThenArg } from '@wdio/types'
import type { ElementReference, ProtocolCommandsAsync, ProtocolCommands } from '@wdio/protocols'
import type { Browser as PuppeteerBrowser } from 'puppeteer-core/lib/cjs/puppeteer/common/Browser'

import type BrowserCommands from './commands/browser'
import type ElementCommands from './commands/element'
import type DevtoolsInterception from './utils/interception/devtools'

export type BrowserCommandsType = typeof BrowserCommands
export type BrowserCommandsTypeSync = {
    [K in keyof Omit<BrowserCommandsType, 'execute'>]: (...args: Parameters<BrowserCommandsType[K]>) => ThenArg<ReturnType<BrowserCommandsType[K]>>
} & {
    /**
     * we need to copy type definitions for execute and executeAsync as we can't copy over
     * generics with method used above
     */
    execute: <T, U extends any[] = any[], V extends U = any>(
        script: string | ((...innerArgs: V) => T),
        ...args: U
    ) => T
}
export type ElementCommandsType = typeof ElementCommands
export type ElementCommandsTypeSync = {
    [K in keyof ElementCommandsType]: (...args: Parameters<ElementCommandsType[K]>) => ThenArg<ReturnType<ElementCommandsType[K]>>
}

export interface ElementArray extends Array<WebdriverIO.Element> {
    selector: Selector
    parent: WebdriverIO.Element | WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    foundWith: string
    props: any[]
}

type AddCommandFnScoped<
    InstanceType = WebdriverIO.Browser,
    IsElement extends boolean = false
> = (
    this: IsElement extends true ? WebdriverIO.Element : InstanceType,
    ...args: any[]
) => any

type AddCommandFn = (...args: any[]) => any

type OverwriteCommandFnScoped<
    ElementKey extends keyof ElementCommandsType,
    BrowserKey extends keyof BrowserCommandsType,
    IsElement extends boolean = false
> = (
    this: IsElement extends true ? WebdriverIO.Element : WebdriverIO.Browser,
    origCommand: (...args: any[]) => IsElement extends true ? WebdriverIO.Element[ElementKey] : WebdriverIO.Browser[BrowserKey],
    ...args: any[]
) => Promise<any>

type OverwriteCommandFn<
    ElementKey extends keyof ElementCommandsType,
    BrowserKey extends keyof BrowserCommandsType,
    IsElement extends boolean = false
> = (
    origCommand: (...args: any[]) => IsElement extends true ? WebdriverIO.Element[ElementKey] : WebdriverIO.Browser[BrowserKey],
    ...args: any[]
) => Promise<any>

export interface CustomInstanceCommands<T> {
    /**
     * add command to `browser` or `element` scope
     */
    addCommand<IsElement extends boolean = false>(
        name: string,
        func: AddCommandFn | AddCommandFnScoped<T, IsElement>,
        attachToElement?: IsElement,
        proto?: Record<string, any>,
        instances?: Record<string, WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser>
    ): void;

    /**
     * overwrite `browser` or `element` command
     */
    overwriteCommand<ElementKey extends keyof ElementCommandsType, BrowserKey extends keyof BrowserCommandsType, IsElement extends boolean = false>(
        name: IsElement extends true ? ElementKey : BrowserKey,
        func: OverwriteCommandFn<ElementKey, BrowserKey, IsElement> | OverwriteCommandFnScoped<ElementKey, BrowserKey, IsElement>,
        attachToElement?: IsElement,
        proto?: Record<string, any>,
        instances?: Record<string, WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser>
    ): void;

    /**
     * create custom selector
     */
    addLocatorStrategy(
        name: string,
        func: (selector: string) => HTMLElement | HTMLElement[] | NodeListOf<HTMLElement>
    ): void
}

interface InstanceBase extends EventEmitter, SessionFlags {
    sessionId: string
    capabilities: Capabilities.RemoteCapability
    requestedCapabilities: Capabilities.RemoteCapability
    options: Options.WebdriverIO | Options.Testrunner
    puppeteer?: PuppeteerBrowser
    strategies: Map<any, any>
    __propertiesObject__: Record<string, PropertyDescriptor>

    /**
     * @private
     */
    _NOT_FIBER?: boolean
    /**
     * @private
     */
    wdioRetries?: number
}

/**
 * a browser base that has everything besides commands which are defined for sync and async seperately
 */
export interface BrowserBase extends InstanceBase, CustomInstanceCommands<WebdriverIO.Browser> {
    isMultiremote: false
}

/**
 * export a browser interface that can be used for typing plugins
 */
interface BrowserAsync extends BrowserBase, BrowserCommandsType, ProtocolCommandsAsync {}
interface BrowserSync extends BrowserBase, BrowserCommandsTypeSync, ProtocolCommands {}
export type Browser<T extends 'sync' | 'async'> = T extends 'sync' ? BrowserSync : BrowserAsync

export interface ElementBase extends InstanceBase, ElementReference, CustomInstanceCommands<WebdriverIO.Element> {
    isMultiremote: false
    /**
     * WebDriver element reference
     */
    elementId: string
    /**
     * WebDriver element reference
     */
    ELEMENT: string
    /**
     * selector used to fetch this element, can be
     * - undefined if element was created via `$({ 'element-6066-11e4-a52e-4f735466cecf': 'ELEMENT-1' })`
     * - a string if `findElement` was used and a reference was found
     * - or a functin if element was found via e.g. `$(() => document.body)`
     */
    selector: Selector
    /**
     * index of the element if fetched with `$$`
     */
    index?: number
    /**
     * parent of the element if fetched via `$(parent).$(child)`
     */
    parent: WebdriverIO.Element | WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    /**
     * true if element is a React component
     */
    isReactElement?: boolean
    /**
     * error response if element was not found
     */
    error?: Error
}

interface ElementAsync extends ElementBase, ProtocolCommandsAsync, Omit<BrowserCommandsType, keyof ElementCommandsType>, ElementCommandsType {}
interface ElementSync extends ElementBase, ProtocolCommands, Omit<BrowserCommandsTypeSync, keyof ElementCommandsTypeSync>, ElementCommandsTypeSync {}
export type Element<T extends 'sync' | 'async'> = T extends 'sync' ? ElementSync : ElementAsync

interface MultiRemoteBase extends Omit<InstanceBase, 'sessionId'>, CustomInstanceCommands<WebdriverIO.MultiRemoteBrowser> {
    /**
     * multiremote browser instance names
     */
    instances: string[]
    /**
     * flag to indicate multiremote browser session
     */
    isMultiremote: true
}

type MultiRemoteBrowserReferenceAsync = Record<string, Browser<'async'> | Element<'async'>>
type MultiRemoteBrowserReferenceSync = Record<string, Browser<'sync'> | Element<'sync'>>
interface MultiRemoteBrowserAsync extends MultiRemoteBase, BrowserCommandsType, ProtocolCommandsAsync { }
interface MultiRemoteBrowserSync extends MultiRemoteBase, BrowserCommandsTypeSync, ProtocolCommands { }
export type MultiRemoteBrowser<T extends 'sync' | 'async'> = T extends 'sync' ? MultiRemoteBrowserReferenceSync & MultiRemoteBrowserSync : MultiRemoteBrowserReferenceAsync & MultiRemoteBrowserAsync

export type ElementFunction = ((elem: HTMLElement) => HTMLElement) | ((elem: HTMLElement) => HTMLElement[])
export type Selector = string | ElementReference | ElementFunction

interface CSSValue {
    type: string
    string: string
    unit: string
    value: any
}

interface ParsedColor extends Partial<CSSValue> {
    rgb?: string
    rgba?: string
}

export interface ParsedCSSValue {
    property?: string
    value?: string
    parsed: ParsedColor
}

interface NoneActionEntity {
    type: 'pause'
    duration: number
}

interface PointerActionEntity {
    type: 'pointerMove' | 'pointerDown' | 'pointerUp' | 'pointerCancel' | 'pause'
    duration?: number
    x?: number
    y?: number
    button?: number
}

interface KeyActionEntity {
    type: 'keyUp' | 'keyDown'
    duration?: number
    value?: string
}

export interface Action {
    id: string
    actions: (NoneActionEntity & PointerActionEntity & KeyActionEntity)[]
    type?: 'pointer' | 'key'
    parameters?: {
        pointerType: 'mouse' | 'pen' | 'touch'
    }
}

export interface ActionParameter {
    actions: Action[]
}

export type ActionTypes = 'press' | 'longPress' | 'tap' | 'moveTo' | 'wait' | 'release';
export interface TouchAction {
    action: ActionTypes,
    x?: number,
    y?: number,
    element?: WebdriverIO.Element,
    ms?: number
}
export type TouchActionParameter = string | string[] | TouchAction | TouchAction[];
export type TouchActions = TouchActionParameter | TouchActionParameter[];

export type Matcher = {
    name: string,
    args: Array<string | object>
    class?: string
}

export type ReactSelectorOptions = {
    props?: object,
    state?: any[] | number | string | object | boolean
}

export type MoveToOptions = {
    xOffset?: number,
    yOffset?: number
}

export type DragAndDropOptions = {
    duration?: number
}

export type NewWindowOptions = {
    windowName?: string,
    windowFeatures?: string
}

export type ClickOptions = {
    button?: number | string,
    x?: number,
    y?: number
}

export type WaitForOptions = {
    timeout?: number,
    interval?: number,
    timeoutMsg?: string,
    reverse?: boolean,
}

export type WaitUntilOptions = {
    timeout?: number,
    timeoutMsg?: string,
    interval?: number
}

export type DragAndDropCoordinate = {
    x: number,
    y: number
}

/**
 * WebdriverIO Mock definition
 */
type MockFunctions = FunctionProperties<DevtoolsInterception>
type MockProperties = Pick<DevtoolsInterception, 'calls'>
export interface Mock extends MockFunctions, MockProperties {}
