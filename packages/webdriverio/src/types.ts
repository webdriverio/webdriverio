import type { EventEmitter } from 'events'
import type { AttachOptions as DevToolsAttachOptions } from 'devtools'
import type { SessionFlags, AttachOptions as WebDriverAttachOptions } from 'webdriver'
import type { Options, Capabilities, FunctionProperties, ThenArg } from '@wdio/types'
import type { ElementReference, ProtocolCommandsAsync, ProtocolCommands, RectReturn } from '@wdio/protocols'
import type { Browser as PuppeteerBrowser } from 'puppeteer-core/lib/cjs/puppeteer/common/Browser'

import type BrowserCommands from './commands/browser'
import type ElementCommands from './commands/element'
import type DevtoolsInterception from './utils/interception/devtools'
import type { Location } from './commands/element/getLocation'
import type { Size } from './commands/element/getSize'

type $BrowserCommands = typeof BrowserCommands
type $ElementCommands = typeof ElementCommands

type ElementQueryCommands = '$' | 'custom$' | 'shadow$' | 'react$'
type ElementsQueryCommands = '$$' | 'custom$$' | 'shadow$$' | 'react$$'
type ChainablePrototype = {
    [K in ElementQueryCommands]: (...args: Parameters<$ElementCommands[K]>) => ChainablePromiseElement<ReturnType<$ElementCommands[K]>>
} & {
    [K in ElementsQueryCommands]: (...args: Parameters<$ElementCommands[K]>) => ChainablePromiseArray<ThenArg<ReturnType<$ElementCommands[K]>>>
}

type AsyncElementProto = {
    [K in keyof Omit<$ElementCommands, keyof ChainablePrototype>]: OmitThisParameter<$ElementCommands[K]>
} & ChainablePrototype

export interface ChainablePromiseElement<T> extends AsyncElementProto, Promise<T> {
    /**
     * WebDriver element reference
     */
    elementId: Promise<string>
    /**
     * parent of the element if fetched via `$(parent).$(child)`
     */
    parent: Promise<WebdriverIO.Element | WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser>
    /**
     * selector used to fetch this element, can be
     * - undefined if element was created via `$({ 'element-6066-11e4-a52e-4f735466cecf': 'ELEMENT-1' })`
     * - a string if `findElement` was used and a reference was found
     * - or a functin if element was found via e.g. `$(() => document.body)`
     */
    selector: Promise<Selector>
    /**
     * Error message in case element fetch was not successful
     */
    error?: Promise<Error>
    /**
     * index of the element if fetched with `$$`
     */
    index?: Promise<number>
}
export interface ChainablePromiseArray<T> extends Promise<T> {
    /**
     * Amount of element fetched.
     */
    length: Promise<number>
    /**
     * selector used to fetch this element, can be
     * - undefined if element was created via `$({ 'element-6066-11e4-a52e-4f735466cecf': 'ELEMENT-1' })`
     * - a string if `findElement` was used and a reference was found
     * - or a functin if element was found via e.g. `$(() => document.body)`
     */
    selector: Promise<Selector>
    /**
     * parent of the element if fetched via `$(parent).$(child)`
     */
    parent: Promise<WebdriverIO.Element | WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser>
    /**
     * allow to access a specific index of the element set
     */
    [n: number]: WebdriverIO.Element | undefined

    /**
     * Unwrap the nth element of the element list.
     */
    forEach: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => void, thisArg?: any) => Promise<void>
    forEachSeries: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => void, thisArg?: any) => Promise<void>
    map: <U>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => U | Promise<U>, thisArg?: any) => Promise<U[]>
    mapSeries: <T, U>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => U | Promise<U>, thisArg?: any) => Promise<U[]>;
    find: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => boolean | Promise<boolean>, thisArg?: any) => Promise<T>;
    findSeries: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => boolean | Promise<boolean>, thisArg?: any) => Promise<T>;
    findIndex: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => boolean | Promise<boolean>, thisArg?: any) => Promise<number>;
    findIndexSeries: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => boolean | Promise<boolean>, thisArg?: any) => Promise<number>;
    some: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => boolean | Promise<boolean>, thisArg?: any) => Promise<boolean>;
    someSeries: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => boolean | Promise<boolean>, thisArg?: any) => Promise<boolean>;
    every: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => boolean | Promise<boolean>, thisArg?: any) => Promise<boolean>;
    everySeries: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => boolean | Promise<boolean>, thisArg?: any) => Promise<boolean>;
    filter: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => boolean | Promise<boolean>, thisArg?: any) => Promise<WebdriverIO.Element[]>;
    filterSeries: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => boolean | Promise<boolean>, thisArg?: any) => Promise<WebdriverIO.Element[]>;
    reduce: <T, U>(callback: (accumulator: U, currentValue: WebdriverIO.Element, currentIndex: number, array: T[]) => U | Promise<U>, initialValue?: U) => Promise<U>;
}

export type BrowserCommandsType = Omit<$BrowserCommands, keyof ChainablePrototype> & ChainablePrototype
export type ElementCommandsType = Omit<$ElementCommands, keyof ChainablePrototype> & ChainablePrototype

export type BrowserCommandsTypeSync = {
    [K in keyof Omit<$BrowserCommands, 'execute' | 'call'>]: (...args: Parameters<$BrowserCommands[K]>) => ThenArg<ReturnType<$BrowserCommands[K]>>
} & {
    /**
     * we need to copy type definitions for execute and executeAsync as we can't copy over
     * generics with method used above
     */
    call: <T>(fn: () => T) => ThenArg<T>,
    execute: <ReturnValue, InnerArguments extends any[] = any[], OuterArguments extends InnerArguments = any>(
        script: string | ((...innerArgs: OuterArguments) => ReturnValue),
        ...args: InnerArguments
    ) => ReturnValue,
}
export type ElementCommandsTypeSync = {
    [K in keyof Omit<$ElementCommands, 'getLocation' | 'getSize'>]: (...args: Parameters<$ElementCommands[K]>) => ThenArg<ReturnType<$ElementCommands[K]>>
} & {
    getLocation: ((
        this: WebdriverIO.Element,
    ) => Location) & ((
        this: WebdriverIO.Element,
        prop: keyof Location
    ) => number) & ((
        this: WebdriverIO.Element,
        prop?: keyof Location
    ) => Location | number),

    getSize: ((
        this: WebdriverIO.Element,
    ) => Size) & ((
        this: WebdriverIO.Element,
        prop: keyof RectReturn
    ) => number) & ((
        this: WebdriverIO.Element,
        prop?: keyof RectReturn
    ) => Size | number),
}

/**
 * Multiremote command definition
 */
type SingleElementCommandNames = '$' | 'custom$' | 'react$'
type MultiElementCommandNames = '$$' | 'custom$$' | 'react$$'
type ElementCommandNames = SingleElementCommandNames | MultiElementCommandNames
type MultiRemoteElementCommands = {
    [K in keyof Pick<BrowserCommandsType, SingleElementCommandNames>]: (...args: Parameters<BrowserCommandsType[K]>) => ThenArg<MultiRemoteElement<'async'>>
} & {
    [K in keyof Pick<BrowserCommandsType, MultiElementCommandNames>]: (...args: Parameters<BrowserCommandsType[K]>) => ThenArg<MultiRemoteElement<'async'>[]>
}
type MultiRemoteElementCommandsSync = {
    [K in keyof Pick<BrowserCommandsTypeSync, SingleElementCommandNames>]: (...args: Parameters<BrowserCommandsTypeSync[K]>) => MultiRemoteElement<'sync'>
} & {
    [K in keyof Pick<BrowserCommandsTypeSync, MultiElementCommandNames>]: (...args: Parameters<BrowserCommandsTypeSync[K]>) => MultiRemoteElement<'sync'>[]
}

export type MultiRemoteBrowserCommandsType = {
    [K in keyof Omit<BrowserCommandsType, ElementCommandNames>]: (...args: Parameters<BrowserCommandsType[K]>) => Promise<ThenArg<ReturnType<BrowserCommandsType[K]>>[]>
} & MultiRemoteElementCommands
export type MultiRemoteBrowserCommandsTypeSync = {
    [K in keyof Omit<BrowserCommandsTypeSync, ElementCommandNames>]: (...args: Parameters<BrowserCommandsTypeSync[K]>) => ThenArg<ReturnType<BrowserCommandsTypeSync[K]>>[]
} & MultiRemoteElementCommandsSync
export type MultiRemoteElementCommandsType = {
    [K in keyof Omit<ElementCommandsType, ElementCommandNames>]: (...args: Parameters<ElementCommandsType[K]>) => Promise<ThenArg<ReturnType<ElementCommandsType[K]>>[]>
} & MultiRemoteElementCommands
export type MultiRemoteElementCommandsTypeSync = {
    [K in keyof Omit<ElementCommandsTypeSync, ElementCommandNames>]: (...args: Parameters<ElementCommandsTypeSync[K]>) => ThenArg<ReturnType<ElementCommandsTypeSync[K]>>[]
} & MultiRemoteElementCommandsSync
export type MultiRemoteProtocolCommandsType = {
    [K in keyof ProtocolCommandsAsync]: (...args: Parameters<ProtocolCommandsAsync[K]>) => Promise<ThenArg<ReturnType<ProtocolCommandsAsync[K]>>[]>
}
export type MultiRemoteProtocolCommandsTypeSync = {
    [K in keyof ProtocolCommands]: (...args: Parameters<ProtocolCommands[K]>) => ThenArg<ReturnType<ProtocolCommands[K]>>[]
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
    ElementKey extends keyof $ElementCommands,
    BrowserKey extends keyof $BrowserCommands,
    IsElement extends boolean = false
> = (
    this: IsElement extends true ? WebdriverIO.Element : WebdriverIO.Browser,
    origCommand: (...args: any[]) => IsElement extends true ? WebdriverIO.Element[ElementKey] : WebdriverIO.Browser[BrowserKey],
    ...args: any[]
) => Promise<any>

type OverwriteCommandFn<
    ElementKey extends keyof $ElementCommands,
    BrowserKey extends keyof $BrowserCommands,
    IsElement extends boolean = false
> = (
    origCommand: (...args: any[]) => IsElement extends true ? WebdriverIO.Element[ElementKey] : WebdriverIO.Browser[BrowserKey],
    ...args: any[]
) => Promise<any>

export type CustomLocatorReturnValue = HTMLElement | HTMLElement[] | NodeListOf<HTMLElement>
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
    overwriteCommand<ElementKey extends keyof $ElementCommands, BrowserKey extends keyof $BrowserCommands, IsElement extends boolean = false>(
        name: IsElement extends true ? ElementKey : BrowserKey,
        func: OverwriteCommandFn<ElementKey, BrowserKey, IsElement> | OverwriteCommandFnScoped<ElementKey, BrowserKey, IsElement>,
        attachToElement?: IsElement,
        proto?: Record<string, any>,
        instances?: Record<string, WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser>
    ): void;

    /**
     * create custom selector
     */
    addLocatorStrategy<IsElement extends boolean = false>(
        name: string,
        func: IsElement extends true
            ? (selector: string, root: HTMLElement) => CustomLocatorReturnValue
            : (selector: string) => CustomLocatorReturnValue
    ): void
}

interface InstanceBase extends EventEmitter, SessionFlags {
    /**
     * Session id for the current running session
     */
    sessionId: string
    /**
     * Applied capabilities used in the current session. Note: these can differ from the actual
     * requested capabilities if the remote end couldn't provide an exact match.
     */
    capabilities: Capabilities.RemoteCapability
    /**
     * Requested capabilities defined in the config object.
     */
    requestedCapabilities: Capabilities.RemoteCapability
    /**
     * Applied WebdriverIO options (options that aren't officially part of WebdriverIO are stripped
     * out of this object).
     */
    options: Options.WebdriverIO | Options.Testrunner
    /**
     * Given WebdriverIO options (including custom configurations)
     */
    config: Options.WebdriverIO | Options.Testrunner
    /**
     * Puppeteer instance
     */
    puppeteer?: PuppeteerBrowser
    strategies: Map<any, any>

    /**
     * @private
     */
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
export type Browser<Mode extends 'sync' | 'async'> = Mode extends 'sync' ? BrowserSync : BrowserAsync

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
    parent: WebdriverIO.Element | WebdriverIO.Browser
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
export type Element<Mode extends 'sync' | 'async'> = Mode extends 'sync' ? ElementSync : ElementAsync

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
interface MultiRemoteElementBase {
    /**
     * multiremote browser instance names
     */
    instances: string[]
    addCommand: Function
    overwriteCommand: Function
}

type MultiRemoteBrowserReferenceAsync = Record<string, Browser<'async'>>
type MultiRemoteBrowserReferenceSync = Record<string, Browser<'sync'>>
type MultiRemoteElementReferenceAsync = Record<string, Element<'async'>>
type MultiRemoteElementReferenceSync = Record<string, Element<'sync'>>
interface MultiRemoteBrowserAsync extends MultiRemoteBase, MultiRemoteBrowserCommandsType, MultiRemoteProtocolCommandsType { }
interface MultiRemoteBrowserSync extends MultiRemoteBase, MultiRemoteBrowserCommandsTypeSync, MultiRemoteProtocolCommandsTypeSync { }
interface MultiRemoteElementAsync extends MultiRemoteElementBase, MultiRemoteProtocolCommandsType, Omit<MultiRemoteBrowserCommandsType, keyof MultiRemoteElementCommandsType>, MultiRemoteElementCommandsType {}
interface MultiRemoteElementSync extends MultiRemoteElementBase, MultiRemoteProtocolCommandsTypeSync, Omit<MultiRemoteBrowserCommandsTypeSync, keyof MultiRemoteElementCommandsTypeSync>, MultiRemoteElementCommandsTypeSync {}
export type MultiRemoteBrowser<Mode extends 'sync' | 'async'> = Mode extends 'sync' ? MultiRemoteBrowserReferenceSync & MultiRemoteBrowserSync : MultiRemoteBrowserReferenceAsync & MultiRemoteBrowserAsync
export type MultiRemoteElement<Mode extends 'sync' | 'async'> = Mode extends 'sync' ? MultiRemoteElementReferenceSync & MultiRemoteElementSync : MultiRemoteElementReferenceAsync & MultiRemoteElementAsync

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
    hex?: string
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

export interface AttachOptions extends Omit<DevToolsAttachOptions, 'capabilities'>, Omit<WebDriverAttachOptions, 'capabilities'> {
    options?: {
        automationProtocol?: Options.SupportedProtocols,
    }
    capabilities: DevToolsAttachOptions['capabilities'] | WebDriverAttachOptions['capabilities'],
    requestedCapabilities?: DevToolsAttachOptions['capabilities'] | WebDriverAttachOptions['capabilities'],
}
