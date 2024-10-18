import { ELEMENT_KEY, type local, type remote } from 'webdriver'

import { getContextManager } from '../../context.js'
import { LocalValue } from '../../utils/bidi/value.js'
import { parseScriptResult } from '../../utils/bidi/index.js'
import { SCRIPT_PREFIX, SCRIPT_SUFFIX } from '../constant.js'
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
        switchToFrameHelper(this, handle)
        return handle
    }

    if (typeof context === 'string') {
        const tree = await this.browsingContextGetTree({})
        let newContextId: string | undefined

        const urlContext = findContext(context, tree.contexts, byUrl)?.context
        if (urlContext) {
            newContextId = urlContext
        }

        const urlContextContaining = findContext(context, tree.contexts, byUrlContaining)?.context
        if (urlContextContaining) {
            newContextId = urlContextContaining
        }

        const contextIdContext = findContext(context, tree.contexts, byContextId)?.context
        if (contextIdContext) {
            newContextId = contextIdContext
        }

        if (newContextId) {
            const allContexts = await getFlatContextTree(this)
            const allContextIds = Object.keys(allContexts)
            const allFrames = (await Promise.all(allContextIds.map((id) => (
                this.browsingContextLocateNodes({
                    locator: { type: 'css', value: 'iframe' },
                    context: id
                }).then(
                    ({ nodes }) => Promise.all(nodes.map(async (node) => {
                        const html = `<iframe${Object.entries(node.value?.attributes || {}).reduce((acc, [key, value]) => `${acc} ${key}="${value}"`, ' ')}></iframe>`
                        const args = [{ [ELEMENT_KEY]: node.sharedId }]
                        const userScript = (iframe: unknown) => (iframe as HTMLIFrameElement).contentWindow
                        const functionDeclaration = new Function(`
                            return (${SCRIPT_PREFIX}${userScript.toString()}${SCRIPT_SUFFIX}).apply(this, arguments);
                        `).toString()
                        const params: remote.ScriptCallFunctionParameters = {
                            functionDeclaration,
                            awaitPromise: true,
                            arguments: args.map((arg) => LocalValue.getArgument(arg)) as any,
                            target: {
                                context: id
                            }
                        }
                        const result = await this.scriptCallFunction(params)
                        const { context } = parseScriptResult(params, result) as { context: string }
                        console.log('---->', context, newContextId, node.value?.attributes)

                        return { context, html, frameElement: { [ELEMENT_KEY]: node.sharedId } } as FrameResult
                    })),
                    () => [] as FrameResult[]
                )
            )))).flat(Infinity) as FrameResult[]

            const desiredFrame = allFrames.find(({ context }) => context === newContextId)
            if (desiredFrame) {
                switchToFrameHelper(this, desiredFrame.context)
                await browser.switchToFrame(desiredFrame.frameElement)
                return newContextId
            }

            throw new Error(`Frame with url or context id "${context}" not found, available frames to switch to:\n  - ${allFrames.map(({ html }) => html).join('\n  - ')}`)
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
        const sessionContext = getContextManager(this)
        const currentContext = await sessionContext.getCurrentContext()
        const allContexts = await getFlatContextTree(this)
        const allContextIds = Object.keys(allContexts)
        const allFrames = (await Promise.all(allContextIds.map((id) => (
            this.browsingContextLocateNodes({
                locator: { type: 'css', value: 'iframe' },
                context: id
            })
        )))).flat(Infinity)

        for (const iframe of allFrames) {
            const contextId = await switchToFrameUsingElement(this, iframe as any)
            const isWithinFrame = await context(allContexts[contextId])
            if (isWithinFrame) {
                return iframe
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

interface FrameResult {
    context: string
    frameElement: { [ELEMENT_KEY]: string }
    html: string
}

async function switchToFrameHelper (browser: WebdriverIO.Browser, context: string) {
    const sessionContext = getContextManager(browser)
    sessionContext.setCurrentContext(context)
}

async function switchToFrameUsingElement (browser: WebdriverIO.Browser, element: WebdriverIO.Element) {
    const frame = await element.execute(
        (iframe: unknown) => (iframe as HTMLIFrameElement).contentWindow
    ) as unknown as { context: string }

    switchToFrameHelper(browser, frame.context)
    await browser.switchToFrame(element)
    return frame.context
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
    urlOrId: string,
    contexts: local.BrowsingContextInfoList | null,
    matcher: typeof byUrl | typeof byUrlContaining | typeof byContextId
): local.BrowsingContextInfo | undefined {
    for (const context of contexts || []) {
        if (matcher(context, urlOrId)) {
            return context
        }

        if (Array.isArray(context.children) && context.children.length > 0) {
            const result = findContext(urlOrId, context.children, matcher)
            if (result) {
                return result
            }
        }
    }

    return undefined
}

async function getFlatContextTree (browser: WebdriverIO.Browser): Promise<Record<string, FlatContextTree>> {
    const tree = await browser.browsingContextGetTree({})

    const mapContext = (context: local.BrowsingContextInfo): any => [
        context.context,
        ...(context.children || []).map(mapContext)
    ]

    /**
     * transform context tree into a flat list of context objects with references
     * to children
     */
    const allContexts: Record<string, FlatContextTree> = tree.contexts.map(mapContext).flat(Infinity)
        .reduce((acc, ctx) => {
            const context = findContext(ctx, tree.contexts, byContextId)
            acc[ctx] = context
            return acc
        }, {} as Record<string, FlatContextTree>)
    return allContexts
}
