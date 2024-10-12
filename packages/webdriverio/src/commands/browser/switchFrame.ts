import { type local } from 'webdriver'

import { getContextManager } from '../../context.js'
import type { ChainablePromiseElement } from '../../types.js'

type FlatContextTree = Omit<local.BrowsingContextInfo, 'children'> & { children: string[] }

/**
 * Switches the active context to a frame, e.g. an iframe on the page. There are multiple ways you can query a frame
 * on the page:
 *
 *   - If given a string it switches to the frame with a matching context id, url or url that contains that string
 *     ```ts
 *     // switch to a frame that has the url "https://the-internet.herokuapp.com/iframe"
 *     await browser.switchFrame('https://the-internet.herokuapp.com/iframe')
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
 *   - If given a function it will loop through all iframes on the page and call the function with the context
 *     object. The function should return a boolean indicating if the frame should be selected. Within the function
 *     you can use WebdriverIO commands to e.g. check if a certain frame element exists.
 *     ```ts
 *     // switch to first frame that contains an element with id "#frameContent"
 *     await browser.switchFrame(() => $('#frameContent').isExisting())
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
 * @alias browser.switchFrame
 * @param {string|object|function} context
 * @returns {Promise<string>} the current active context id
 */
export async function switchFrame (
    this: WebdriverIO.Browser,
    context: WebdriverIO.Element | ChainablePromiseElement | string | null | ((tree: FlatContextTree) => boolean | Promise<boolean>)
) {
    /**
     * if context is `null` the user is switching to the top level frame
     * which is always represented by the value of `getWindowHandle`
     */
    if (context === null) {
        const handle = await this.getWindowHandle()
        await switchToFrameHelper(this, handle)
        return handle
    }

    if (typeof context === 'string') {
        const tree = await this.browsingContextGetTree({})
        const urlContext = findContext(context, tree.contexts, byUrl)?.context
        if (urlContext) {
            await switchToFrameHelper(this, urlContext)
            return urlContext
        }

        const urlContextContaining = findContext(context, tree.contexts, byUrlContaining)?.context
        if (urlContextContaining) {
            await switchToFrameHelper(this, urlContextContaining)
            return urlContextContaining
        }

        const contextIdContext = findContext(context, tree.contexts, byContextId)?.context
        if (contextIdContext) {
            await switchToFrameHelper(this, contextIdContext)
            return contextIdContext
        }

        throw new Error(`Frame with url or context id "${context}" not found`)
    }

    /**
     * we are dealing with a WebdriverIO element
     */
    if (typeof context === 'object' && typeof (context as WebdriverIO.Element).getElement === 'function') {
        const element = await context.getElement()
        return switchToFrameUsingElement(this, element)
    }

    if (typeof context === 'function') {
        const tree = await this.browsingContextGetTree({})
        const mapContext = (context: local.BrowsingContextInfo): any => [
            context.context,
            ...(context.children || []).map(mapContext)
        ]
        const sessionContext = getContextManager(this)
        const currentContext = await sessionContext.getCurrentContext()

        /**
         * transform context tree into a flat list of context objects with references
         * to children
         */
        const allContexts: Record<string, FlatContextTree> = tree.contexts.map(mapContext).flat(Infinity)
            .filter((ctx) => ctx !== currentContext)
            .reduce((acc, ctx) => {
                const context = findContext(ctx, tree.contexts, byContextId)
                acc[ctx] = context
                return acc
            }, {} as Record<string, FlatContextTree>)

        for (const [contextId, ctx] of Object.entries(allContexts)) {
            sessionContext.setCurrentContext(contextId)
            const isDesiredFrame = await context(ctx)
            if (isDesiredFrame) {
                return context
            }
        }

        sessionContext.setCurrentContext(currentContext)
        throw new Error('Could not find the desired frame')
    }

    throw new Error(
        `Invalid type for context parameter: ${typeof context}, expected one of number, string or null. ` +
        'Check out our docs: https://webdriver.io/docs/api/browser/switchToFrame.html'
    )
}

function switchToFrameHelper (browser: WebdriverIO.Browser, context: string) {
    const sessionContext = getContextManager(browser)
    sessionContext.setCurrentContext(context)
}

async function switchToFrameUsingElement (browser: WebdriverIO.Browser, element: WebdriverIO.Element) {
    let frameSrc = await element.getAttribute('src')
    if (!frameSrc) {
        const source = await element.getHTML({ includeSelectorTag: true })
        throw new Error(
            `The provided frame element ("${source}") does not have a src attribute needed ` +
            'to detect the context, please use a different method to select the frame. For more ' +
            'information checkout our docs: https://webdriver.io/docs/api/browser/switchFrame.html'
        )
    }

    if (!frameSrc.startsWith('http')) {
        /**
         * use the browser to access `URL.parse` as it is not available in Node.js until v22
         */
        frameSrc = await browser.execute((urlPath: string) => (
            URL.parse(urlPath, window.location.href)?.href
        ), frameSrc) || frameSrc
    }

    const tree = await browser.browsingContextGetTree({})
    const urlContext = findContext(frameSrc, tree.contexts, byUrl)?.context
    if (!urlContext) {
        throw new Error(
            `Frame with url "${frameSrc}" not found! Please try a different method to select ` +
            'the frame. For more information checkout our docs: https://webdriver.io/docs/api/browser/switchFrame.html'
        )
    }

    await switchToFrameHelper(browser, urlContext)
    return urlContext
}

function byUrl (context: local.BrowsingContextInfo, url: string) {
    return context.url === url
}

function byUrlContaining (context: local.BrowsingContextInfo, url: string) {
    return context.url.includes(url)
}

function byContextId (context: local.BrowsingContextInfo, contextId: string) {
    return context.context === contextId
}

function findContext (
    url: string,
    contexts: local.BrowsingContextInfoList | null,
    matcher: typeof byUrl | typeof byUrlContaining | typeof byContextId
): local.BrowsingContextInfo | undefined {
    for (const context of contexts || []) {
        if (matcher(context, url)) {
            return context
        }

        if (Array.isArray(context.children) && context.children.length > 0) {
            const result = findContext(url, context.children, matcher)
            if (result) {
                return result
            }
        }
    }

    return undefined
}
