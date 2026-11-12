import { shareCommands, unwrapCommand, webdriverMonad, wrapCommand } from '@wdio/utils'
import { ELEMENT_KEY } from 'webdriver'
import { getBrowserObject } from '@wdio/utils'
import type { ElementReference } from '@wdio/protocols'

import { getPrototype as getWDIOPrototype, getElementFromResponse } from './index.js'
import { elementErrorHandler } from '../middlewares.js'
import { routeElementEndpoints } from './foreignContext.js'
import * as browserCommands from '../commands/browser.js'
import { REACT_OPTIONS } from './findElementAgain.js'
import type { Selector, AddCommandFn, ExtendedElementReference, ReactSelectorOptions } from '../types.js'

interface GetElementProps {
    isReactElement?: boolean
    isShadowElement?: boolean
    /**
     * whether the element was queried with strict selector semantics, so that
     * re-fetching the element keeps the same behavior
     */
    strict?: boolean
    /**
     * the props and state a `react$` / `react$$` element was queried with, so
     * that finding the element again keeps them
     */
    reactOptions?: ReactSelectorOptions
}

interface WebDriverErrorResponse {
    error: string,
    message: string
    stacktrace: string,
}

class WebDriverError extends Error {
    constructor(obj: Error | WebDriverErrorResponse) {

        const { name, stack } = obj as Error
        const { error, stacktrace } = obj as WebDriverErrorResponse

        super(error || name || '')
        Object.assign(this, {
            message: obj.message,
            stack: stacktrace || stack,
        })
    }
}

/**
 * the names of the browser-only commands, read on first use: `commands/browser.js` imports this
 * module, so its exports can still be missing while this module loads
 */
let browserCommandNames: Set<string> | undefined

/**
 * The descriptors of the elements that `browser` finds: the commands of the browser without the
 * browser-only commands, and the element commands (an element of another held browsing context
 * runs the classic element endpoints in its own context). Each element defines the `emit` of its
 * parent on itself, see `elementCommands`.
 *
 * The descriptors of the browser do not change: each one that the element gets is a copy. Its
 * value is the same: a deep copy (of the options, the BiDi handler, ...) was made for every
 * element and then thrown away or unused.
 */
function elementProperties (browser: WebdriverIO.Browser): PropertyDescriptorMap {
    browserCommandNames ??= new Set(Object.keys(browserCommands))
    const propertiesObject: PropertyDescriptorMap = {}
    for (const [name, descriptor] of Object.entries(browser.__propertiesObject__)) {
        if (browserCommandNames.has(name)) {
            continue
        }
        // the browser wrapped its commands: the element wraps the command itself, so its hooks run once
        propertiesObject[name] = 'value' in descriptor
            ? { ...descriptor, value: unwrapCommand(descriptor.value) }
            : { ...descriptor }
    }
    Object.assign(propertiesObject, getWDIOPrototype('element'), { scope: { value: 'element' } })
    routeElementEndpoints(propertiesObject)
    /**
     * the shared commands do not depend on the parent: the own `emit` of each element hides this one
     */
    propertiesObject.emit = {
        value: function emit (this: WebdriverIO.Element, ...args: Parameters<WebdriverIO.Element['emit']>) {
            return this.parent.emit(...args)
        }
    }
    return propertiesObject
}

/**
 * The commands of the elements of a browser, see `elementCommands`
 */
interface ElementCommands {
    options: object
    /**
     * the descriptors and the element overrides of the browser that the commands were built from
     */
    state: unknown[]
    properties: PropertyDescriptorMap
}

/**
 * the element commands of each browser, by its `__propertiesObject__`
 */
const ELEMENT_COMMANDS = new WeakMap<object, ElementCommands>()
const OVERRIDES = Symbol('overrides')

/**
 * The descriptors of the browser and its element overrides, in order: `browser.addCommand` and
 * `browser.overwriteCommand` with `attachToElement` (also of multi-remote, and of a service in a
 * hook), `element.addCommand` and any other code write a new descriptor or override into them.
 */
function stateOf (descriptors: PropertyDescriptorMap, overrides: Record<string, unknown>): unknown[] {
    const state: unknown[] = []
    for (const name of Object.keys(descriptors)) {
        const descriptor = descriptors[name]
        state.push(name, descriptor, descriptor?.value, descriptor?.get, descriptor?.set)
    }
    state.push(OVERRIDES)
    for (const name of Object.keys(overrides)) {
        state.push(name, overrides[name])
    }
    return state
}

function hasState (state: unknown[], descriptors: PropertyDescriptorMap, overrides: Record<string, unknown>): boolean {
    let i = 0
    for (const name of Object.keys(descriptors)) {
        const descriptor = descriptors[name]
        if (
            state[i] !== name || state[i + 1] !== descriptor || state[i + 2] !== descriptor?.value ||
            state[i + 3] !== descriptor?.get || state[i + 4] !== descriptor?.set
        ) {
            return false
        }
        i += 5
    }
    if (state[i++] !== OVERRIDES) {
        return false
    }
    for (const name of Object.keys(overrides)) {
        if (state[i++] !== name || state[i++] !== overrides[name]) {
            return false
        }
    }
    return i === state.length
}

/**
 * The properties for the monad of an element that `parent` finds. The elements of a browser share
 * their wrapped commands (see `shareCommands`): one wrapper and one object with the commands,
 * instead of a deep copy of the descriptors of the browser and about 280 wrapped commands for
 * each element. The commands are built again when the descriptors or the element overrides of the
 * browser changed since, so an element gets the commands of the browser at the time it is made,
 * as before. Each element has the `emit` of its parent.
 */
function elementCommands (parent: WebdriverIO.Browser | WebdriverIO.Element, browser: WebdriverIO.Browser): PropertyDescriptorMap {
    const source = browser.__propertiesObject__
    const overrides = (source.__elementOverrides__?.value ?? {}) as Record<string, unknown>
    let commands = ELEMENT_COMMANDS.get(source)
    if (!commands || commands.options !== parent.options || !hasState(commands.state, source, overrides)) {
        const state = stateOf(source, overrides)
        commands = {
            options: parent.options,
            state,
            properties: shareCommands(parent.options, elementProperties(browser), elementErrorHandler(wrapCommand))
        }
        ELEMENT_COMMANDS.set(source, commands)
    }
    return { ...commands.properties, emit: { value: parent.emit.bind(parent) } }
}

/**
 * transforms a findElement response into a WDIO element
 * @param  {string} selector  selector that was used to query the element
 * @param  {Object} res       findElement response
 * @return {Object}           WDIO element object
 */
export function getElement(
    this: WebdriverIO.Browser | WebdriverIO.Element,
    selector?: Selector,
    res?: ElementReference | ExtendedElementReference | Error,
    propsParam: GetElementProps = {}
): WebdriverIO.Element {
    const props: GetElementProps = { isReactElement: false, isShadowElement: false, ...propsParam }
    const browser = getBrowserObject(this)
    const element = webdriverMonad(this.options, (client: WebdriverIO.Element) => {
        const elementId = getElementFromResponse(res as ElementReference)

        if (elementId) {
            /**
             * set elementId for easy access
             */
            client.elementId = elementId

            /**
             * set element id with proper key so element can be passed into execute commands
             */
            client[ELEMENT_KEY] = elementId

            /**
             * Attach locator if element was fetched with WebDriver Bidi.
             * This allows to later re-fetch the element within the same conditions.
             */
            if (res && this.isBidi && 'locator' in res) {
                client.locator = res.locator
            }
        } else {
            client.error = res as Error
        }

        if (selector) {
            client.selector = selector
        }
        client.parent = this
        client.isReactElement = props.isReactElement
        client.isShadowElement = props.isShadowElement
        if (typeof props.strict === 'boolean') {
            client.strict = props.strict
        }
        if (props.reactOptions) {
            (client as WebdriverIO.Element & { [REACT_OPTIONS]?: ReactSelectorOptions })[REACT_OPTIONS] = props.reactOptions
        }

        return client
    }, elementCommands(this, browser))

    /**
     * the element uses the command wrapper of the shared commands, see `elementCommands`
     */
    const elementInstance = element(this.sessionId as string)

    const origAddCommand = elementInstance.addCommand.bind(elementInstance)
    elementInstance.addCommand = (name: string, fn: Function) => {
        browser.__propertiesObject__[name] = { value: fn }
        origAddCommand(name, fn)
    }

    return elementInstance
}

/**
 * transforms a findElements response into an array of WDIO elements
 * @param  {string} selector  selector that was used to query the element
 * @param  {Object} res       findElements response
 * @return {Array}            array of WDIO elements
 */
export const getElements = function getElements(
    this: WebdriverIO.Browser | WebdriverIO.Element,
    selector: Selector | ElementReference[] | WebdriverIO.Element[],
    elemResponse: (ElementReference | ExtendedElementReference | Error | WebDriverError)[],
    props: GetElementProps = { isReactElement: false, isShadowElement: false }
): WebdriverIO.Element[] {
    if (elemResponse.length === 0) {
        return []
    }

    const browser = getBrowserObject(this as WebdriverIO.Element)
    /**
     * The items of the list share their wrapped commands (#16086), see `elementCommands`. Read for
     * the first new item: a list of elements that are already elements needs none.
     */
    let listProperties: PropertyDescriptorMap | undefined
    const elements = [elemResponse].flat(1).map((res: ElementReference | ExtendedElementReference | Element | Error | WebDriverError, i) => {
        /**
         * if we already deal with an element, just return it
         */
        if ((res as WebdriverIO.Element).selector && '$$' in res) {
            return res as WebdriverIO.Element
        }

        const element = webdriverMonad(this.options, (client: WebdriverIO.Element) => {
            const elementId = getElementFromResponse(res as ElementReference)

            if (elementId) {
                /**
                 * set elementId for easy access
                 */
                client.elementId = elementId

                /**
                 * set element id with proper key so element can be passed into execute commands
                 */
                client[ELEMENT_KEY] = elementId

                /**
                 * Attach locator if element was fetched with WebDriver Bidi.
                 * This allows to later re-fetch the element within the same conditions.
                 */
                if (res && this.isBidi && 'locator' in res) {
                    client.locator = res.locator
                }
            } else {
                res = res as WebDriverError | Error
                client.error = res instanceof Error ? res : new WebDriverError(res)
            }

            client.selector = Array.isArray(selector)
                ? (selector[i] as WebdriverIO.Element).selector
                : selector
            client.parent = this
            client.index = i
            client.isReactElement = props.isReactElement
            client.isShadowElement = props.isShadowElement
            /**
             * multi element queries are never strict, remember that so that
             * re-fetching one of these elements doesn't suddenly become strict
             */
            client.strict = false
            if (props.reactOptions) {
                (client as WebdriverIO.Element & { [REACT_OPTIONS]?: ReactSelectorOptions })[REACT_OPTIONS] = props.reactOptions
            }

            return client
        }, listProperties ??= elementCommands(this, browser))

        /**
         * an item uses the command wrapper of the shared commands, see `elementCommands`
         */
        const elementInstance: WebdriverIO.Element = element((this as WebdriverIO.Browser).sessionId)

        const origAddCommand = elementInstance.addCommand.bind(elementInstance)
        elementInstance.addCommand = (name: string, fn: AddCommandFn) => {
            browser.__propertiesObject__[name] = { value: fn }
            origAddCommand(name, fn)
        }
        return elementInstance
    })

    return elements
}
