/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EventEmitter } from 'node:events'
import type { remote, SessionFlags, AttachOptions as WebDriverAttachOptions, BidiHandler, EventMap } from 'webdriver'
import type { Capabilities, Options, ThenArg } from '@wdio/types'
import type { ElementReference, ProtocolCommands } from '@wdio/protocols'
import type { Browser as PuppeteerBrowser } from 'puppeteer-core'

import type { Dialog as DialogImport } from './session/dialog.js'
import type * as BrowserCommands from './commands/browser.js'
import type * as ElementCommands from './commands/element.js'
import type { Button, ButtonNames } from './utils/actions/pointer.js'
import type WebDriverInterception from './utils/interception/index.js'

/**
 * export mock primitives
 */
export * from './utils/interception/types.js'
/**
 * re-export action primitives
 */
export * from './utils/actions/index.js'
/**
 * re-export command types
 */
export { InitScript } from './commands/browser/addInitScript.js'

type $BrowserCommands = typeof BrowserCommands
type $ElementCommands = typeof ElementCommands

type ElementQueryCommands = '$' | 'custom$' | 'shadow$' | 'react$'
type ElementsQueryCommands = '$$' | 'custom$$' | 'shadow$$' | 'react$$'
type ChainablePrototype = {
    [K in ElementQueryCommands]: (...args: Parameters<$ElementCommands[K]>) => ChainablePromiseElement
} & {
    [K in ElementsQueryCommands]: (...args: Parameters<$ElementCommands[K]>) => ChainablePromiseArray
}

type AsyncElementProto = {
    [K in keyof Omit<$ElementCommands, keyof ChainablePrototype>]: OmitThisParameter<$ElementCommands[K]>
} & ChainablePrototype

interface ChainablePromiseBaseElement {
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
     * - or a function if element was found via e.g. `$(() => document.body)`
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
    /**
     * get the `WebdriverIO.Element` reference
     */
    getElement(): Promise<WebdriverIO.Element>
}
export interface ChainablePromiseElement extends
    ChainablePromiseBaseElement,
    AsyncElementProto,
    Omit<WebdriverIO.Element, keyof ChainablePromiseBaseElement | keyof AsyncElementProto> {}

interface AsyncIterators<T> {
    /**
     * Unwrap the nth element of the element list.
     */
    forEach: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => void, thisArg?: T) => Promise<void>
    forEachSeries: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => void, thisArg?: T) => Promise<void>
    map: <U>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => U | Promise<U>, thisArg?: T) => Promise<U[]>
    mapSeries: <T, U>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => U | Promise<U>, thisArg?: T) => Promise<U[]>;
    find: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => boolean | Promise<boolean>, thisArg?: T) => Promise<T>;
    findSeries: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => boolean | Promise<boolean>, thisArg?: T) => Promise<T>;
    findIndex: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => boolean | Promise<boolean>, thisArg?: T) => Promise<number>;
    findIndexSeries: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => boolean | Promise<boolean>, thisArg?: T) => Promise<number>;
    some: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => boolean | Promise<boolean>, thisArg?: T) => Promise<boolean>;
    someSeries: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => boolean | Promise<boolean>, thisArg?: T) => Promise<boolean>;
    every: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => boolean | Promise<boolean>, thisArg?: T) => Promise<boolean>;
    everySeries: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => boolean | Promise<boolean>, thisArg?: T) => Promise<boolean>;
    filter: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => boolean | Promise<boolean>, thisArg?: T) => Promise<WebdriverIO.Element[]>;
    filterSeries: <T>(callback: (currentValue: WebdriverIO.Element, index: number, array: T[]) => boolean | Promise<boolean>, thisArg?: T) => Promise<WebdriverIO.Element[]>;
    reduce: <T, U>(callback: (accumulator: U, currentValue: WebdriverIO.Element, currentIndex: number, array: T[]) => U | Promise<U>, initialValue?: U) => Promise<U>;
    entries(): AsyncIterableIterator<[number, WebdriverIO.Element]>;
}

export interface ChainablePromiseArray extends AsyncIterators<WebdriverIO.Element> {
    [Symbol.asyncIterator](): AsyncIterableIterator<WebdriverIO.Element>
    [Symbol.iterator](): IterableIterator<WebdriverIO.Element>

    /**
     * Amount of element fetched.
     */
    length: Promise<number>
    /**
     * selector used to fetch this element, can be
     * - undefined if element was created via `$({ 'element-6066-11e4-a52e-4f735466cecf': 'ELEMENT-1' })`
     * - a string if `findElement` was used and a reference was found
     * - or a function if element was found via e.g. `$(() => document.body)`
     */
    selector: Promise<Selector>
    /**
     * parent of the element if fetched via `$(parent).$(child)`
     */
    parent: Promise<WebdriverIO.Element | WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser>
    /**
     * allow to access a specific index of the element set
     */
    [n: number]: ChainablePromiseElement
    /**
     * get the `WebdriverIO.Element[]` list
     */
    getElements(): Promise<WebdriverIO.ElementArray>

    /**
     * Returns an async iterator of key/value pairs for every index in the array.
     */
    entries(): AsyncIterableIterator<[number, WebdriverIO.Element]>
}

export type BrowserCommandsType = Omit<$BrowserCommands, keyof ChainablePrototype> & ChainablePrototype
export type ElementCommandsType = Omit<$ElementCommands, keyof ChainablePrototype> & ChainablePrototype

/**
 * Multiremote command definition
 */
type SingleElementCommandNames = '$' | 'custom$' | 'react$'
type MultiElementCommandNames = '$$' | 'custom$$' | 'react$$'
type ElementCommandNames = SingleElementCommandNames | MultiElementCommandNames
type MultiRemoteElementCommands = {
    [K in keyof Pick<BrowserCommandsType, SingleElementCommandNames>]: (...args: Parameters<BrowserCommandsType[K]>) => ThenArg<WebdriverIO.MultiRemoteElement>
} & {
    [K in keyof Pick<BrowserCommandsType, MultiElementCommandNames>]: (...args: Parameters<BrowserCommandsType[K]>) => ThenArg<WebdriverIO.MultiRemoteElement[]>
}

export type MultiRemoteBrowserCommandsType = {
    [K in keyof Omit<BrowserCommandsType, ElementCommandNames | 'SESSION_MOCKS' | 'CDP_SESSIONS'>]: (...args: Parameters<BrowserCommandsType[K]>) => Promise<ThenArg<ReturnType<BrowserCommandsType[K]>>[]>
} & MultiRemoteElementCommands
export type MultiRemoteElementCommandsType = {
    [K in keyof Omit<ElementCommandsType, ElementCommandNames>]: (...args: Parameters<ElementCommandsType[K]>) => Promise<ThenArg<ReturnType<ElementCommandsType[K]>>[]>
} & MultiRemoteElementCommands
export type MultiRemoteProtocolCommandsType = {
    [K in keyof ProtocolCommands]: (...args: Parameters<ProtocolCommands[K]>) => Promise<ThenArg<ReturnType<ProtocolCommands[K]>>[]>
}

interface ElementArrayExport extends Omit<Array<WebdriverIO.Element>, keyof AsyncIterators<WebdriverIO.Element>>, AsyncIterators<WebdriverIO.Element> {
    /**
     * selector used to fetch this element, can be
     * - undefined if element was created via `$({ 'element-6066-11e4-a52e-4f735466cecf': 'ELEMENT-1' })`
     * - a string if `findElement` was used and a reference was found
     * - or a function if element was found via e.g. `$(() => document.body)`
     */
    selector: Selector
    /**
     * parent of the element if fetched via `$(parent).$(child)`
     */
    parent: WebdriverIO.Element | WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    /**
     * command name with which this element was found, e.g. `$$`, `react$$`, `custom$$`, `shadow$$`
     */
    foundWith: string
    /**
     * properties of the fetched elements
     */
    props: any[]
    /**
     * Amount of element fetched.
     */
    length: number
    /**
     * get the `WebdriverIO.Element[]` list
     */
    getElements(): Promise<WebdriverIO.ElementArray>
}
export type ElementArray = ElementArrayExport

type AddCommandFnScoped<
    InstanceType = WebdriverIO.Browser,
    IsElement extends boolean = false
> = (
    this: IsElement extends true ? WebdriverIO.Element : InstanceType,
    ...args: any[]
) => any

export type AddCommandFn = (...args: any[]) => any

type OverwriteCommandFnScoped<
    ElementKey extends keyof $ElementCommands,
    BrowserKey extends keyof $BrowserCommands,
    IsElement extends boolean = false
> = (
    this: IsElement extends true ? WebdriverIO.Element : WebdriverIO.Browser,
    originalCommand: IsElement extends true ? OmitThisParameter<$ElementCommands[ElementKey]> : OmitThisParameter<$BrowserCommands[BrowserKey]>,
    ...args: any[]
) => Promise<any>

type OverwriteCommandFn<
    ElementKey extends keyof $ElementCommands,
    BrowserKey extends keyof $BrowserCommands,
    IsElement extends boolean = false
> = (
    this: IsElement extends true ? WebdriverIO.Element : WebdriverIO.Browser,
    originalCommand: IsElement extends true ? OmitThisParameter<$ElementCommands[ElementKey]> : OmitThisParameter<$BrowserCommands[BrowserKey]>,
    ...args: any[]
) => Promise<any>

export type CustomLocatorReturnValue = HTMLElement | HTMLElement[] | NodeListOf<HTMLElement>

type Instances = WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser

export interface CustomInstanceCommands<T> {
    /**
     * add command to `browser` or `element` scope
     */
    addCommand<IsElement extends boolean = false, Instance extends Instances = WebdriverIO.Browser>(
        name: string,
        func: IsElement extends true ? AddCommandFnScoped<T | Instance, IsElement> : AddCommandFn,
        attachToElement?: IsElement,
        proto?: Record<string, any>,
        instances?: Record<string, Instances>,
        disableElementImplicitWait?: boolean
    ): void;

    /**
     * overwrite `browser` or `element` command
     */
    overwriteCommand<ElementKey extends keyof $ElementCommands, BrowserKey extends keyof $BrowserCommands, IsElement extends boolean = false>(
        name: IsElement extends true ? ElementKey : BrowserKey,
        func: IsElement extends true ? OverwriteCommandFnScoped<ElementKey, BrowserKey, IsElement> : OverwriteCommandFn<ElementKey, BrowserKey, IsElement>,
        attachToElement?: IsElement,
        proto?: Record<string, any>,
        instances?: Record<string, Instances>
    ): void;

    /**
     * create custom selector
     */
    addLocatorStrategy(
        name: string,
        func: ((selector: string, root: HTMLElement) => CustomLocatorReturnValue) | ((selector: string) => CustomLocatorReturnValue)
    ): void
}

interface InstanceBase extends EventEmitter, SessionFlags {
    /**
     * Session id for the current running session
     */
    sessionId: string
    /**
     * Applied WebdriverIO options (options that aren't officially part of WebdriverIO are stripped
     * out of this object).
     */
    options: Options.WebdriverIO | Options.Testrunner
    /**
     * Puppeteer instance
     */
    puppeteer?: PuppeteerBrowser
    strategies: Map<any, any>
    commandList: string[]

    /**
     * @private
     */
    __propertiesObject__: Record<string, PropertyDescriptor>
    /**
     * @private
     */
    wdioRetries?: number
}

/**
 * a browser base that has everything besides commands which are defined for sync and async separately
 */
export interface BrowserBase extends InstanceBase, CustomInstanceCommands<WebdriverIO.Browser> {
    isMultiremote: false
    /**
     * capabilities of the browser instance
     */
    capabilities: WebdriverIO.Capabilities
}

export type WebdriverIOEventMap = EventMap & {
    'dialog': WebdriverIO.Dialog
}

interface BidiEventHandler {
    on<K extends keyof WebdriverIOEventMap>(event: K, listener: (this: WebdriverIO.Browser, param: WebdriverIOEventMap[K]) => void): this
    once<K extends keyof WebdriverIOEventMap>(event: K, listener: (this: WebdriverIO.Browser, param: WebdriverIOEventMap[K]) => void): this
}

/**
 * @private
 */
export interface Browser extends Omit<BrowserBase, 'on' | 'once'>, BidiEventHandler, BidiHandler, ProtocolCommands, BrowserCommandsType {}

/**
 * export a browser interface that can be used for typing plugins
 */
export interface ElementBase extends InstanceBase, ElementReference, CustomInstanceCommands<WebdriverIO.Element> {
    /**
     * capabilities of the browser instance
     */
    capabilities: WebdriverIO.Capabilities
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
     * true if element was queried from a shadow root
     */
    isShadowElement?: boolean
    /**
     * error response if element was not found
     */
    error?: Error
    /**
     * locator of the element
     * @requires WebDriver Bidi
     */
    locator?: remote.BrowsingContextLocator
}
/**
 * @deprecated use `WebdriverIO.Element` instead
 */
export interface Element extends ElementBase, ProtocolCommands, ElementCommandsType {}

interface MultiRemoteBase extends Omit<InstanceBase, 'sessionId'>, CustomInstanceCommands<WebdriverIO.MultiRemoteBrowser> {
    /**
     * capabilities of the browser instance
     */
    capabilities: Capabilities.RequestedMultiremoteCapabilities
    /**
     * multiremote browser instance names
     */
    instances: string[]
    /**
     * flag to indicate multiremote browser session
     */
    isMultiremote: true
    /**
     * get a specific instance to run commands on it
     */
    getInstance: (browserName: string) => WebdriverIO.Browser
}
interface MultiRemoteElementBase {
    selector: string
    /**
     * multiremote browser instance names
     */
    instances: string[]
    commandList: string[]
    addCommand: Function
    overwriteCommand: Function
    /**
     * flag to indicate multiremote browser session
     */
    isMultiremote: true
    /**
     * get a specific instance to run commands on it
     */
    getInstance: (browserName: string) => WebdriverIO.Element
    // @private
    __propertiesObject__: never
}

interface MultiRemoteBrowserType extends MultiRemoteBase, MultiRemoteBrowserCommandsType, MultiRemoteProtocolCommandsType { }
/**
 * @deprecated use `WebdriverIO.MultiRemoteBrowser` instead
 */
export interface MultiRemoteBrowser extends MultiRemoteBrowserType {}
interface MultiRemoteElementType extends MultiRemoteElementBase, MultiRemoteProtocolCommandsType, Omit<MultiRemoteBrowserCommandsType, keyof MultiRemoteElementCommandsType>, MultiRemoteElementCommandsType {}

/**
 * @deprecated use `WebdriverIO.MultiRemoteElement` instead
 */
export interface MultiRemoteElement extends MultiRemoteElementType {}

export type ElementFunction = ((elem: HTMLElement) => HTMLElement | undefined) | ((elem: HTMLElement) => (HTMLElement | undefined)[])
export type CustomStrategyFunction = (...args: any) => ElementReference | ElementReference[]
export type CustomStrategyReference = {
    strategy: CustomStrategyFunction
    strategyName: string
    strategyArguments: any[]
}
export type Selector = string | ElementReference | ElementFunction | CustomStrategyReference | HTMLElement

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
    actions: (NoneActionEntity | PointerActionEntity | KeyActionEntity)[]
    type?: 'pointer' | 'key'
    parameters?: {
        pointerType: 'mouse' | 'pen' | 'touch'
    }
}

export interface ActionParameter {
    actions: Action[]
}

export type ActionTypes = 'press' | 'longPress' | 'tap' | 'moveTo' | 'wait' | 'release'
export interface TouchAction {
    action: ActionTypes,
    x?: number,
    y?: number,
    element?: WebdriverIO.Element,
    ms?: number
}
export type TouchActionParameter = string | string[] | TouchAction | TouchAction[]
export type TouchActions = TouchActionParameter | TouchActionParameter[]

export type Matcher = {
    name: string,
    args: Array<string | object>
    class?: string
}

export type ReactSelectorOptions = {
    props?: Record<string, unknown>
    state?: Record<string, unknown>
}

export type MoveToOptions = {
    xOffset?: number,
    yOffset?: number
}

export type DragAndDropOptions = {
    duration?: number
}

export type NewWindowOptions = {
    type?: 'tab' | 'window',
    windowName?: string,
    windowFeatures?: string
}

export type TapOptions = MobileScrollIntoViewOptions & {
    x?: number,
    y?: number
}

export type LongPressOptions = {
    x: number,
    y: number,
    duration: number
}

export type ClickOptions = LongPressOptions & {
    button: Button | ButtonNames,
    skipRelease: boolean
}

export type PinchAndZoomOptions = {
    duration: number
    scale: number,
}

export type WaitForOptions = {
    timeout?: number,
    interval?: number,
    timeoutMsg?: string,
    reverse?: boolean,
    withinViewport?: boolean
}

export enum MobileScrollDirection {
    Down = 'down',
    Up = 'up',
    Left = 'left',
    Right = 'right',
}

export type XY = {
    x: number,
    y: number
}

export type SwipeOptions = {
    direction?: `${MobileScrollDirection}`;
    duration?: number;
    from?: XY;
    percent?: number;
    scrollableElement?: WebdriverIO.Element | ChainablePromiseElement ;
    to?: XY;
}

export type MobileScrollIntoViewOptions = SwipeOptions & {
    maxScrolls?: number;
}

export interface CustomScrollIntoViewOptions extends ScrollIntoViewOptions, MobileScrollIntoViewOptions {
}

export type SwitchContextOptions = {
    appIdentifier?: string;
    title?: string | RegExp;
    url?: string | RegExp;

    // Extra for the getContexts command for Android
    androidWebviewConnectionRetryTime?: number;
    androidWebviewConnectTimeout?: number;
}

type AppiumDetailedContextInterface = {
    id: string;
    title?: string;
    url?: string;
}

type IosContextBundleId  = {
    bundleId?: string;
}

export type IosDetailedContext = AppiumDetailedContextInterface & IosContextBundleId

export type AndroidDetailedContext = AppiumDetailedContextInterface & {
    androidWebviewData?: {
        attached: boolean;
        empty: boolean;
        height: number;
        neverAttached: boolean;
        screenX: number;
        screenY: number;
        visible: boolean;
        width: number;
    };
    packageName?: string;
    webviewPageId?: string;
}

export type AppiumDetailedCrossPlatformContexts = (IosDetailedContext | AndroidDetailedContext)[]

export type GetContextsOptions = {
    androidWebviewConnectionRetryTime?: number;
    androidWebviewConnectTimeout?: number;
    filterByCurrentAndroidApp?: boolean;
    isAndroidWebviewVisible?: boolean;
    returnAndroidDescriptionData?: boolean;
    returnDetailedContexts?: boolean;
}

export type ActiveAppInfo = {
    pid: number;
    bundleId: string;
    name: string;
    processArguments: {
        args: string[];
        env: Record<string, string>;
    };
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

export interface AttachOptions extends Omit<WebDriverAttachOptions, 'capabilities'> {
    options?: Options.WebdriverIO
    capabilities?: WebDriverAttachOptions['capabilities']
    requestedCapabilities?: WebDriverAttachOptions['capabilities']
}

export type ThrottlePreset = 'offline' | 'GPRS' | 'Regular2G' | 'Good2G' | 'Regular3G' | 'Good3G' | 'Regular4G' | 'DSL' | 'WiFi' | 'online'
export interface CustomThrottle {
    offline: boolean
    downloadThroughput: number
    uploadThroughput: number
    latency: number
}
export type ThrottleOptions = ThrottlePreset | CustomThrottle

export interface ExtendedElementReference {
    'element-6066-11e4-a52e-4f735466cecf': string
    locator: remote.BrowsingContextLocator
}

export type SupportedScopes = 'geolocation' | 'userAgent' | 'colorScheme' | 'onLine' | 'clock' | 'device'
export type RestoreMap = Map<SupportedScopes, (() => Promise<any>)[]>

export interface SaveScreenshotOptions {
    /**
     * Whether to take a screenshot of the full page or just the current viewport.
     * @default false
     */
    fullPage?: boolean
    /**
     * The format of the screenshot.
     * @default 'png'
     */
    format?: 'png' | 'jpeg' | 'jpg'
    /**
     * The quality of the screenshot in case of JPEG format in range 0-100 percent.
     * @default 100
     */
    quality?: number
    /**
     * Clipping a rectangle of the screenshot.
     */
    clip?: {
        x: number
        y: number
        width: number
        height: number
    }
}

export type TransformElement<T> =
    T extends WebdriverIO.Element ? HTMLElement :
        T extends ChainablePromiseElement ? HTMLElement :
            T extends WebdriverIO.Element[] ? HTMLElement[] :
                T extends ChainablePromiseArray ? HTMLElement[] :
                    T extends [infer First, ...infer Rest] ? [TransformElement<First>, ...TransformElement<Rest>] :
                        T extends Array<infer U> ? Array<TransformElement<U>> :
                            T

export type TransformReturn<T> =
    T extends HTMLElement ? WebdriverIO.Element :
        T extends HTMLElement[] ? WebdriverIO.Element[] :
            T extends [infer First, ...infer Rest] ? [TransformReturn<First>, ...TransformReturn<Rest>] :
                T extends Array<infer U> ? Array<TransformReturn<U>> :
                    T

/**
 * Additional options outside of the WebDriver spec, exclusively for WebdriverIO, only for runtime, and not sent to Appium
 */
export interface InputOptions {
    mask?: boolean
}

declare global {
    namespace WebdriverIO {
        /**
         * WebdriverIO browser object
         * @see https://webdriver.io/docs/api/browser
         */
        interface Browser extends Omit<BrowserBase, 'on' | 'once'>, BidiEventHandler, BidiHandler, ProtocolCommands, BrowserCommandsType {}
        /**
         * WebdriverIO element object
         * @see https://webdriver.io/docs/api/element
         */
        interface Element extends ElementBase, ProtocolCommands, ElementCommandsType {}
        /**
         * WebdriverIO element array
         * When fetching elements via `$$`, `custom$$` or `shadow$$` commands an array of elements
         * is returns. This array has extended prototype properties to provide information about
         * the parent element, selector and properties of the fetched elements. This is useful to
         * e.g. re-fetch the set in case no elements got returned.
         */
        interface ElementArray extends ElementArrayExport {}
        /**
         * WebdriverIO multiremote browser object
         * A multiremote browser instance is a property on the global WebdriverIO browser object that
         * allows to control multiple browser instances at once. It can be represented as `Record<string, WebdriverIO.Browser>`
         * where `string` is the capability name defined in the WebdriverIO options.
         *
         * @see https://webdriver.io/docs/multiremote/
         */
        interface MultiRemoteBrowser extends MultiRemoteBrowserType {}
        /**
         * WebdriverIO multiremote browser object
         * A multiremote browser instance is a property on the global WebdriverIO browser object that
         * allows to control multiple browser instances at once. It can be represented as `Record<string, WebdriverIO.Element>`
         * where `string` is the capability name defined in the WebdriverIO options.
         *
         * @see https://webdriver.io/docs/multiremote/
         */
        interface MultiRemoteElement extends MultiRemoteElementType {}
        /**
         * WebdriverIO Mock object
         * The mock object is an object that represents a network mock and contains information about
         * requests that were matching given url and filterOptions. It can be received using the mock command.
         *
         * @see https://webdriver.io/docs/api/mock
         */
        interface Mock extends WebDriverInterception {}
        /**
         * WebdriverIO Dialog object
         * The dialog object represents a user prompt that was triggered by the browser. It contains
         * information about the message, type and default value of the prompt.
         * It can be received using the `on('dialog')` event.
         *
         * @see https://webdriver.io/docs/api/dialog
         */
        interface Dialog extends DialogImport {}
    }
}
