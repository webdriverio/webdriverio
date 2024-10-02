import { ELEMENT_KEY, type local } from 'webdriver'

import { getContextManager } from '../../context.js'

export async function switchToFrame (
    this: WebdriverIO.Browser,
    context: WebdriverIO.Element | number | string | null
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

    if (typeof context === 'number') {
        const iframes = await this.$$('iframe').getElements()
        const frame = iframes[context]
        if (!frame) {
            throw new Error(`Frame with index ${context} not found, only ${iframes.length} frames available`)
        }

        return switchToFrameUsingElement(this, frame)
    }

    if (typeof context === 'string') {
        const tree = await this.browsingContextGetTree({})
        const urlContext = findContext(context, tree.contexts, byUrl)
        if (urlContext) {
            await switchToFrameHelper(this, urlContext)
            return urlContext
        }

        const urlContextContaining = findContext(context, tree.contexts, byUrlContaining)
        if (urlContextContaining) {
            await switchToFrameHelper(this, urlContextContaining)
            return urlContextContaining
        }

        const contextIdContext = findContext(context, tree.contexts, byContextId)
        if (contextIdContext) {
            await switchToFrameHelper(this, contextIdContext)
            return contextIdContext
        }

        throw new Error(`Frame with url or context id "${context}" not found`)
    }

    console.log(555, context, context.getElement)
    if (typeof context === 'object') {
        /**
         * we are dealing with a WebdriverIO element
         */
        if ('getElement' in context) {
            const element = await context.getElement()
            return switchToFrameUsingElement(this, element)
        }

        if (ELEMENT_KEY in context) {
            const element = await this.$(context).getElement()
            return switchToFrameUsingElement(this, element)
        }
    }

    throw new Error(
        `Invalid type for context parameter: ${typeof context}, expected one of number, string or null. ` +
        'Check out our docs: https://webdriver.io/docs/api/browser/switchToFrame.html'
    )
}

function switchToFrameHelper (browser: WebdriverIO.Browser, context: string) {
    const sessionContext = getContextManager(browser)
    sessionContext.setCurrentContext(context)
    return browser.browsingContextActivate({ context })
}

async function switchToFrameUsingElement (browser: WebdriverIO.Browser, element: WebdriverIO.Element) {
    let frameSrc = await element.getAttribute('src')
    if (!frameSrc) {
        throw new Error(`Frame with index ${context} has no src attribute`)
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
    const urlContext = findContext(frameSrc, tree.contexts, byUrl)
    if (!urlContext) {
        throw new Error(`Frame with url "${frameSrc}" not found`)
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
    contexts: local.BrowsingContextInfoList,
    matcher: typeof byUrl | typeof byUrlContaining
): string | undefined {
    for (const context of contexts) {
        if (matcher(context, url)) {
            return context.context
        }

        if (context.children && context.children.length > 0) {
            const result = findContext(url, context.children, matcher)
            if (result) {
                return result
            }
        }
    }

    return undefined
}
