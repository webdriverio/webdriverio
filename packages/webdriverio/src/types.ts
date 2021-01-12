import type cssValue from 'css-value'
import type * as WebDriver from 'webdriver'
import type { Options, Capabilities } from '@wdio/types'
import type {
    AppiumCommandsAsync, ChromiumCommandsAsync, JSONWPCommandsAsync, MJSONWPCommandsAsync,
    SauceLabsCommandsAsync, SeleniumCommandsAsync, WebDriverCommandsAsync, ElementReference
} from '@wdio/protocols'
import { Browser as PuppeteerBrowser } from 'node_modules/puppeteer-core/lib/cjs/puppeteer/common/Browser'

import type BrowserCommands from './commands/browser'
import type ElementCommands from './commands/element'

type BrowserCommandsType = typeof BrowserCommands
type ElementCommandsType = typeof ElementCommands

interface ProtocolCommands extends WebDriverCommandsAsync, Omit<JSONWPCommandsAsync, keyof WebDriverCommandsAsync>, AppiumCommandsAsync, ChromiumCommandsAsync, Omit<MJSONWPCommandsAsync, keyof AppiumCommandsAsync | keyof ChromiumCommandsAsync>, SauceLabsCommandsAsync, SeleniumCommandsAsync {}

export interface ElementArray extends Array<Element> {
    selector: Selector
    parent: Element | Browser | MultiRemoteBrowser
    foundWith: string
    props: any[]
}

type AddCommandFn<IsElement extends boolean = false> = (this: IsElement extends true ? Element : Browser, ...args: any[]) => any
type OverwriteCommandFn<ElementKey extends keyof Element, BrowserKey extends keyof Browser, IsElement extends boolean = false> = (this: IsElement extends true ? Element : Browser, origCommand: IsElement extends true ? Element[ElementKey] : Browser[BrowserKey], ...args: any[]) => any

export interface CustomInstanceCommands {
    /**
     * add command to `browser` or `element` scope
     */
    addCommand<IsElement extends boolean = false>(
        name: string,
        func: AddCommandFn<IsElement>,
        attachToElement?: IsElement
    ): void;

    /**
     * overwrite `browser` or `element` command
     */
    overwriteCommand<ElementKey extends keyof Element, BrowserKey extends keyof Browser, IsElement extends boolean = false>(
        name: IsElement extends true ? ElementKey : BrowserKey,
        func: OverwriteCommandFn<ElementKey, BrowserKey, IsElement>,
        attachToElement?: IsElement
    ): void;

    /**
     * create custom selector
     */
    addLocatorStrategy(
        name: string,
        func: (selector: string) => HTMLElement | HTMLElement[] | NodeListOf<HTMLElement>
    ): void
}

export interface Browser extends CustomInstanceCommands, BrowserCommandsType, Omit<WebDriver.Client, 'options' | 'capabilities'>, ProtocolCommands {
    sessionId: string
    capabilities: Capabilities.RemoteCapability
    options: Options.WebdriverIO | Options.Testrunner
    strategies: Map<any, any>
    isMultiremote: false
    puppeteer?: PuppeteerBrowser
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

export interface Element extends ElementReference, Omit<Browser, keyof ElementCommandsType>, ElementCommandsType {
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
    parent: Element | Browser | MultiRemoteBrowser
    /**
     * true if element is a React component
     */
    isReactElement?: boolean
    /**
     * error response if element was not found
     */
    error?: Error
}

type MultiRemoteBrowserReference = Record<string, Browser>

interface MultiRemoteBase extends ProtocolCommands, BrowserCommandsType, Omit<Browser, 'isMultiremote'> {
    /**
     * multiremote browser instance names
     */
    instances: string[]
    /**
     * flag to indicate multiremote browser session
     */
    isMultiremote: true
}

export type MultiRemoteBrowser = MultiRemoteBase & MultiRemoteBrowserReference

export type ElementFunction = ((elem: HTMLElement) => HTMLElement) | ((elem: HTMLElement) => HTMLElement[])
export type Selector = string | ElementReference | ElementFunction

interface ParsedColor extends Partial<cssValue.CSSValue> {
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
    element?: Element,
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

export type PDFPrintOptions = {
    orientation?: string,
    scale?: number,
    background?: boolean,
    width?: number,
    height?: number,
    top?: number,
    bottom?: number,
    left?: number,
    right?: number,
    shrinkToFit?: boolean,
    pageRanges?: object[]
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
