import logger from '@wdio/logger'
import { ELEMENT_KEY, type remote } from 'webdriver'
import type { ElementReference } from '@wdio/protocols'

import { getContextManager, type FlatContextTree } from '../../session/context.js'
import { LocalValue } from '../../utils/bidi/value.js'
import { parseScriptResult } from '../../utils/bidi/index.js'
import { SCRIPT_PREFIX, SCRIPT_SUFFIX } from '../constant.js'
import type { ChainablePromiseElement } from '../../types.js'
import findIframeInShadowDOM from '../../scripts/shadowDom.js'

const log = logger('webdriverio:switchFrame')

/**
 * Switches the active context to a frame, e.g. an iframe on the page. There are multiple ways you can query a frame
 * on the page:
 *
 *   - If given a string it switches to the frame with a matching context id, url or url that contains that string
 *     ```ts
 *     // switch to a frame that has a specific url or contains a string in the url
 *     await browser.url('https://www.w3schools.com/tags/tryit.asp?filename=tryhtml_iframe')
 *     // Note: this frame is located in a nested iframe, however you only need to provide
 *     // the frame url of your desired frame
 *     await browser.switchFrame('https://www.w3schools.com')
 *     // check the title of the page
 *     console.log(await browser.execute(() => [document.title, document.URL]))
 *     // outputs: [ 'W3Schools Online Web Tutorials', 'https://www.w3schools.com/' ]
 *     ```
 *
 *   - If you have the context id of the frame you can use it directly
 *     ```ts
 *     // switch to a frame that has a certain context id
 *     await browser.switchFrame('A5734774C41F8C91D483BDD4022B2EF3')
 *     ```
 *
 *   - If given a WebdriverIO element that references an `iframe` element it will switch to that frame
 *     ```ts
 *     // switch to a frame element queried from current context
 *     await browser.switchFrame($('iframe'))
 *     ```
 *
 *   - If given a function it will loop through all iframes on the page and call the function within the context
 *     object. The function should return a boolean indicating if the frame should be selected. The function
 *     will be executed within the browser and allows access to all Web APIs, e.g.:
 *     ```ts
 *     // switch to first frame that contains an element with id "#frameContent"
 *     await browser.switchFrame(() => Boolean(document.querySelector('#frameContent')))
 *     // switch to first frame that contains "webdriver" in the URL
 *     await browser.switchFrame(() => document.URL.includes('webdriver'))
 *     ```
 *
 *   - If given `null` it will switch to the top level frame
 *     ```ts
 *     // first switch into a frame
 *     await browser.switchFrame($('iframe'))
 *     // do more automation within that frame, then ...
 *
 *     // switch to the top level frame
 *     await browser.switchFrame(null)
 *     ```
 *
 * Once you switched to a frame, all further commands will be executed in the context of that frame,
 * including navigating to different pages.
 *
 * @alias browser.switchFrame
 * @param {string|object|function} context
 * @returns {`Promise<string>`} the current active context id
 */
export async function switchFrame (
    this: WebdriverIO.Browser,
    context: WebdriverIO.Element | ChainablePromiseElement | string | null | ((tree: FlatContextTree) => boolean | Promise<boolean>)
): Promise<string | void> {
    function isPossiblyUnresolvedElement(input: typeof context): input is WebdriverIO.Element | ChainablePromiseElement {
        return Boolean(input) && typeof input === 'object' && typeof (input as WebdriverIO.Element).getElement === 'function'
    }

    /**
     * Check if Bidi is supported, if not, just use the WebDriver Classic `switchToFrame`
     */
    if (!this.isBidi) {
        if (typeof context === 'function') {
            throw new Error('Cannot use a function to fetch a context in WebDriver Classic')
        }
        if (typeof context === 'string') {
            throw new Error('Cannot use a string to fetch a context in WebDriver Classic')
        }
        if (isPossiblyUnresolvedElement(context)) {
            const element = await context.getElement()
            await element.waitForExist({
                timeoutMsg: `Can't switch to frame with selector ${element.selector} because it doesn't exist`
            })
            return switchToFrame(this, element)
        }
        return switchToFrame(this, context)
    }

    const sessionContext = getContextManager(this)

    /**
     * if context is `null` the user is switching to the top level frame
     * which is always represented by the value of `getWindowHandle`
     */
    if (context === null) {
        const handle = await this.getWindowHandle()
        switchToFrameHelper(this, handle)
        await switchToFrame(this, context)
        return handle
    }

    /**
     * if context is a string the user is trying to switch to a frame
     * that has a url that matches the string or a context id that matches
     * the string.
     */
    if (typeof context === 'string') {
        const newContextId = await this.waitUntil(async () => {
            const tree = await this.browsingContextGetTree({})
            const urlContext = (
                sessionContext.findContext(context, tree.contexts, 'byUrl') ||
                /**
                 * In case the user provides an url without `/` at the end, e.g. `https://example.com`,
                 * the `browsingContextGetTree` command may return a context with the url `https://example.com/`.
                 */
                sessionContext.findContext(`${context}/`, tree.contexts, 'byUrl')
            )
            const urlContextContaining = sessionContext.findContext(context, tree.contexts, 'byUrlContaining')
            const contextIdContext = sessionContext.findContext(context, tree.contexts, 'byContextId')

            if (urlContext) {
                log.info(`Found context by url "${urlContext.url}" with context id "${urlContext.context}"`)
                return urlContext.context
            } else if (urlContextContaining) {
                log.info(`Found context by url containing "${urlContextContaining.url}" with context id "${urlContextContaining.context}"`)
                return urlContextContaining.context
            } else if (contextIdContext) {
                log.info(`Found context by id "${contextIdContext}" with url "${contextIdContext.url}"`)
                return contextIdContext.context
            }

            return false
        }, {
            timeout: this.options.waitforTimeout,
            interval: this.options.waitforInterval,
            timeoutMsg: `No frame with url or id "${context}" found within the timeout`
        }) as string // ✅ we ensure it's string

        const currentContext = await sessionContext.getCurrentContext()
        const allContexts = await sessionContext.getFlatContextTree()

        /**
         * Fetch all iframes located in any available frame
         */
        const allFrames = (await Promise.all(Object.keys(allContexts).map(async (id) => {
            /**
             * first, fetch all iframes in given browsing context
             */
            const { nodes } = await this.browsingContextLocateNodes({
                locator: { type: 'css', value: 'iframe, frame' },
                context: id
            }).catch(() => ({ nodes: [] }))

            /**
             * For every iframe located in a browsing context, identify its context id
             * by calling a user script that fetches the content window of the iframe.
             */
            return Promise.all(nodes.map(async (node) => {
                const html = `<iframe${Object.entries(node.value?.attributes || {}).reduce((acc, [key, value]) => `${acc} ${key}="${value}"`, ' ')}></iframe>`
                const args = [{ [ELEMENT_KEY]: node.sharedId }]
                const userScript = (iframe: unknown) => (iframe as HTMLIFrameElement).contentWindow
                const functionDeclaration = new Function(`
                    return (${SCRIPT_PREFIX}${userScript.toString()}${SCRIPT_SUFFIX}).apply(this, arguments);
                `).toString()
                const params: remote.ScriptCallFunctionParameters = {
                    functionDeclaration,
                    awaitPromise: false,
                    arguments: args.map((arg) => LocalValue.getArgument(arg)) as remote.ScriptLocalValue[],
                    target: { context: id }
                }

                const result = await this.scriptCallFunction(params).catch((err) => (
                    log.warn(`Failed to identify frame context id: ${err.message}`)))

                /**
                 * if the script for some reason throws an error, return an empty array
                 * which just gets flattened and removed from the list
                 */
                if (!result) {
                    return [] as FrameResult[]
                }

                const { context } = parseScriptResult(params, result) as { context: string }

                /**
                 * return all useful information we need to switch to the frame
                 */
                return {
                    /**
                     * the actual frame context we need to switch WebDriver Bidi commands to
                     */
                    context,
                    /**
                     * the element reference of the iframe so we can call `switchToFrame` to
                     * switch context for WebDriver Classic commands
                     */
                    frameElement: { [ELEMENT_KEY]: node.sharedId },
                    /**
                     * the context id in which the iframe was found
                     */
                    parentContext: id,
                    /**
                     * an HTML representation of the iframe for a good error message in case
                     * we can't find the desired frame from this list
                     */
                    html,
                } as FrameResult
            }))
        }))).flat(Infinity) as FrameResult[]

        // if we didn't find any frames, we try to find an iframe in the shadow DOM
        // that matches the url fragment or context id
        if (allFrames.length === 0) {
            const urlFragment = typeof context === 'string'
                ? context.split('/').pop() ?? ''
                : ''

            // Execute browser-side script to locate a shadow DOM iframe with matching URL
            const iframeFound = await this.execute(findIframeInShadowDOM, urlFragment)

            if (iframeFound) {
                /**
                 * Re-query all iframes and match by src to convert DOM element into a WebdriverIO element.
                 * Required because browser.execute returns a native DOM element, not a WebdriverIO-compatible one.
                 */
                const allFrames = await this.$$('iframe')
                for (const frame of allFrames) {
                    const src = await frame.getAttribute('src')
                    if (src?.includes(urlFragment)) {
                        return this.switchFrame(frame)
                    }
                }
                // If we found an iframe in the shadow DOM but couldn't resolve it to a WebdriverIO element
                log.warn(`Shadow DOM iframe with src containing "${urlFragment}" found, but could not be resolved into a WebdriverIO element.`)
            }
        }

        /**
         * Our desired frame may be somewhere nested in other frames. In order to properly
         * switch to it, we need to ensure we switch into all nested frames first.
         */
        let desiredFrame: FrameResult | undefined
        let desiredContext = newContextId
        const contextQueue: FrameResult[] = []
        log.info(`Available frames to switch to: ${allFrames.length}, desired context to switch: ${desiredContext}`)
        while (desiredContext !== currentContext) {
            desiredFrame = allFrames.find(({ context }) => context === desiredContext)
            if (!desiredFrame) {
                break
            }

            log.info(contextQueue.length === 0
                ? `Found desired frame with element id ${desiredFrame.frameElement[ELEMENT_KEY]}`
                : `to switch to desired frame, we need to switch to ${desiredFrame.context} first`
            )

            /**
             * call `unshift` so our desired frame comes last in the queue
             */
            contextQueue.unshift(desiredFrame)
            desiredContext = desiredFrame.parentContext
        }

        if (contextQueue.length === 0) {
            throw new Error(`Frame with url or context id "${context}" not found, available frames to switch to:\n  - ${allFrames.map(({ html }) => html).join('\n  - ')}`)
        }

        /**
         * The `contextQueue` contains all frames we have to switch to in order to
         * get to the desired frame. We switch to each frame in the queue and then
         * switch to the desired frame at the end.
         */
        for (const contextToSwitch of contextQueue) {
            switchToFrameHelper(this, contextToSwitch.context)
            await switchToFrame(this, contextToSwitch.frameElement)
        }

        sessionContext.setCurrentContext(newContextId)
        return newContextId
    }

    /**
     * If given context is a WebdriverIO.Element the user wants to switch to an iframe
     * that was previously queried.
     */
    if (isPossiblyUnresolvedElement(context)) {
        const element = await context.getElement()
        await element.waitForExist({
            timeoutMsg: `Can't switch to frame with selector ${element.selector} because it doesn't exist`
        })
        return switchToFrameUsingElement(this, element)
    }

    /**
     * If given context is a function, the user wants to switch to an iframe in which
     * the function returns `true`. We loop through all iframes on the page and call
     * the function for each of them.
     */
    if (typeof context === 'function') {
        const foundContextId = await this.waitUntil(async () => {
            const allContexts = await sessionContext.getFlatContextTree()
            const allContextIds = Object.keys(allContexts)

            for (const contextId of allContextIds) {
                const functionDeclaration = new Function(`
                    return (${SCRIPT_PREFIX}${context.toString()}${SCRIPT_SUFFIX}).apply(this, arguments);
                `).toString()
                const params: remote.ScriptCallFunctionParameters = {
                    functionDeclaration,
                    awaitPromise: false,
                    arguments: [],
                    target: { context: contextId }
                }

                const result = await this.scriptCallFunction(params).catch((err) => {
                    log.warn(`switchFrame context callback threw error: ${err.message}`)
                    return undefined
                })

                if (result && result.type === 'success' && result.result.type === 'boolean' && result.result.value) {
                    return contextId
                }
            }

            return false
        }, {
            timeout: this.options.waitforTimeout,
            interval: this.options.waitforInterval,
            timeoutMsg: 'Could not find the desired frame within the timeout'
        })

        /**
             * reset the context to the top level frame first so we can start the search from the root context
         */
        await this.switchFrame(null)
        await this.switchFrame(foundContextId)
        return foundContextId
    }

    throw new Error(
        `Invalid type for context parameter: ${typeof context}, expected one of number, string or null. ` +
        'Check out our docs: https://webdriver.io/docs/api/browser/switchFrame.html'
    )
}

interface FrameResult {
    context: string
    parentContext: string
    frameElement: { [ELEMENT_KEY]: string }
    html: string
}

function switchToFrameHelper (browser: WebdriverIO.Browser, context: string) {
    const sessionContext = getContextManager(browser)
    sessionContext.setCurrentContext(context)
}

async function switchToFrameUsingElement (browser: WebdriverIO.Browser, element: WebdriverIO.Element) {
    const frame = await browser.execute(
        (iframe: unknown) => (iframe as HTMLIFrameElement).contentWindow,
        element
    ) as unknown as { context: string }

    switchToFrameHelper(browser, frame.context)

    const elementId = element[ELEMENT_KEY]
    await switchToFrame(browser, { [ELEMENT_KEY]: elementId })
    return frame.context
}

/**
 * While we deprecated the `switchToFrame` command for users, we still
 * have to use it internally to enable support for WebDriver Classic.
 * In order to avoid unnecessary deprecation warnings, we disable the
 * deprecation message by setting a flag in the environment variable.
 */
function switchToFrame (browser: WebdriverIO.Browser, frame: ElementReference | number | null) {
    toggleDisableDeprecationWarning()
    return browser.switchToFrame(frame).finally(toggleDisableDeprecationWarning)
}

/**
 * Trigger the `DISABLE_WEBDRIVERIO_DEPRECATION_WARNINGS` environment variable
 * only when running within a Node.js environment.
 */
function toggleDisableDeprecationWarning () {
    if (typeof process !== 'undefined' && process.env) {
        process.env.DISABLE_WEBDRIVERIO_DEPRECATION_WARNINGS = process.env.DISABLE_WEBDRIVERIO_DEPRECATION_WARNINGS
            ? undefined
            : 'true'
    }
}
