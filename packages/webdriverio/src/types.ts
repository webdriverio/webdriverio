import type cssValue from 'css-value'
import type WebDriver from 'webdriver'

export type ElementReferenceId = 'element-6066-11e4-a52e-4f735466cecf'

export type ElementReference = Record<ElementReferenceId, string>

export interface ElementObject extends ElementReference, WebdriverIO.BrowserObject {
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
    selector?: Selector
    /**
     * index of the element if fetched with `$$`
     */
    index?: number
    /**
     * parent of the element if fetched via `$(parent).$(child)`
     */
    parent: ElementObject | WebdriverIO.BrowserObject
    /**
     * true if element is a React component
     */
    isReactElement?: boolean
    /**
     * error response if element was not found
     */
    error?: Error
}

export type WaitForOptions = {
    timeout?: number,
    interval?: number,
    timeoutMsg?: string,
    reverse?: boolean,
}

export type ElementFunction = ((elem: HTMLElement) => WebDriver.ElementReference) | ((elem: HTMLElement) => WebDriver.ElementReference[])
export type Selector = string | WebDriver.ElementReference | ElementFunction

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

export interface MultiRemoteOptions {
    [instanceName: string]: Options
}

export interface Options extends Omit<WebDriver.Options, 'capabilities'> {
    /**
     * Defines the capabilities you want to run in your WebdriverIO session. Check out the
     * [WebDriver Protocol](https://w3c.github.io/webdriver/#capabilities) for more details.
     * If you want to run multiremote session you need to define an object that has the
     * browser instance names as string and their capabilities as values.
     *
     * @example
     * ```js
     * // WebDriver/DevTools session
     * const browser = remote({
     *   capabilities: {
     *     browserName: 'chrome',
     *     browserVersion: 86
     *     platformName: 'Windows 10'
     *   }
     * })
     *
     * // multiremote session
     * const browser = remote({
     *   capabilities: {
     *     browserA: {
     *       browserName: 'chrome',
     *       browserVersion: 86
     *       platformName: 'Windows 10'
     *     },
     *     browserB: {
     *       browserName: 'firefox',
     *       browserVersion: 74
     *       platformName: 'Mac OS X'
     *     }
     *   }
     * })
     * ```
     */
    capabilities?: WebDriver.DesiredCapabilities | WebDriver.W3CCapabilities
    /**
     * Define the protocol you want to use for your browser automation.
     * Currently only webdriver and devtools are supported, as these are
     * the main browser automation technologies available.
     *
     * If you want to automate the browser using devtools, make sure you
     * have the NPM package installed ($ npm install --save-dev devtools).
     *
     * @default 'webdriver'
     */
    automationProtocol?: 'webdriver' | 'devtools' | './protocol-stub'
    /**
     * Shorten `url` command calls by setting a base URL.
     */
    baseUrl?: string
    /**
     * Default timeout for all `waitFor*` commands.
     * (Note the lowercase `f` in the option name.)
     * This timeout only affects commands starting with `waitFor*` and their
     * default wait time.
     *
     * To increase the timeout for a test, please see the framework docs.
     *
     * @default 3000
     */
    waitforTimeout?: number
    /**
     * Default interval for all waitFor* commands to check if an expected
     * state (e.g., visibility) has been changed.
     *
     * @default 500
     */
    waitforInterval?: number
    /**
     * If running on Sauce Labs, you can choose to run tests between different datacenters:
     * US or EU. To change your region to EU, add `region: 'eu'` to your config.
     *
     * __Note:__ This only has an effect if you provide `user` and `key` options that are
     * connected to your Sauce Labs account.
     *
     * @default 'us-west-1'
     */
    region?: 'us' | 'eu' | 'us-west-1' | 'us-east-1' | 'eu-central-1'
    /**
     * Sauce Labs provides a [headless offering](https://saucelabs.com/products/web-testing/sauce-headless-testing)
     * that allows you to run Chrome and Firefox tests headless.
     *
     * __Note:__ This only has an effect if you provide `user` and `key` options that are
     * connected to your Sauce Labs account.
     *
     * @default false
     */
    headless?: boolean
    /**
     * WebdriverIO allows to define custom runner extensions. Currently the only supported
     * runner is `@wdio/local-runner`.
     *
     * @default 'local'
     */
    runner?: string
}
