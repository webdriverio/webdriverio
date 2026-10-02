import type { remote } from 'webdriver'

import type { ChainablePromiseElement, FrameQuery } from '../../types.js'
import { createBidiFunctionDeclaration } from '../../utils/bidi/serialize.js'
import { LocalValue } from '../../utils/bidi/value.js'
import { getBrowsingContext } from '../../browsingContext.js'
import { StrictSelectorError } from '../../utils/strictSelectorError.js'

type FrameTarget = string | WebdriverIO.Element | ChainablePromiseElement | FrameQuery | FramePredicate

type FramePredicate = (context: { context: string, url: string }) => boolean | Promise<boolean>

interface ContextNode {
    context: string
    url: string
    children?: ContextNode[]
}

/**
 * Get a frame (`<iframe>` or `<frame>`) of this browsing context as a browsing
 * context of its own. Commands on the returned context run in the frame's
 * document, also for cross-origin frames, while this context and every other one
 * stay usable. Since v10 this replaces `switchFrame()` in a WebDriver BiDi session.
 *
 * Say how to find the frame with a query, the recommended form:
 *
 * - `{ selector }`: the frame element a CSS or XPath selector finds in this document
 * - `{ url }`: the first frame, at any depth, whose URL equals the string or matches the RegExp
 * - `{ id }`: the frame with this browsing context id
 *
 * It also takes a frame element, or a predicate that is called with the `context`
 * id and `url` of each descendant frame. A string is a shorthand that guesses:
 * a selector when it finds a frame element, then a frame URL (or a part of it),
 * then a context id.
 *
 * `parent` on the result is the context `frame()` was called on for a direct
 * child frame, or the frame in between when the match is nested deeper.
 *
 * <example>
    :frame.js
    it('works with nested frames', async () => {
        const page = await browser.url('https://the-internet.herokuapp.com/nested_frames')
        const top = await page.frame({ selector: 'frame[name="frame-top"]' })
        const middle = await top.frame({ selector: 'frame[name="frame-middle"]' })

        console.log(await middle.$('#content').getText()) // outputs: "MIDDLE"
        console.log(middle.parent?.contextId === top.contextId) // outputs: true
        console.log(await page.getTitle()) // the page itself is still usable
    })
 * </example>
 *
 * <example>
    :frameQueries.js
    it('finds frames by url, id or predicate', async () => {
        const page = await browser.url('https://the-internet.herokuapp.com/nested_frames')

        const top = await page.frame({ url: /frame_top/ })
        const left = await top.frame({ url: /frame_left/ })
        const sameFrame = await page.frame({ id: left.contextId })
        console.log(await sameFrame.$('body').getText()) // outputs: "LEFT"

        const bottom = await page.frame(({ url }) => url.endsWith('/frame_bottom'))
        console.log(await bottom.$('body').getText()) // outputs: "BOTTOM"
    })
 * </example>
 *
 * @param {FrameQuery|WebdriverIO.Element|Function|string} target  the frame to get: a query (`{ selector }`, `{ url }` or `{ id }`), a frame element, a predicate, or a string shorthand
 * @alias browsingContext.frame
 * @return {WebdriverIO.BrowsingContext}  the browsing context of the frame
 * @throws {Error} When no frame matches before the `waitforTimeout` passes, or when a selector finds an element that is not a frame.
 */
export async function frame (
    this: WebdriverIO.BrowsingContext,
    target: FrameTarget
): Promise<WebdriverIO.BrowsingContext> {
    if (typeof target === 'function') {
        return frameByPredicate(this, target)
    }
    if (isFrameQuery(target)) {
        return frameByQuery(this, target)
    }
    if (target && typeof target === 'object') {
        const candidate = target as WebdriverIO.Element
        const element = (typeof candidate.getElement === 'function'
            ? await candidate.getElement()
            : candidate) as WebdriverIO.Element
        return frameFromElement(this, element)
    }
    if (typeof target === 'string') {
        /**
         * A url or context id can appear after the call starts. A selector is
         * checked once, then resolved as an element, so it does not wait out
         * the full timeout before that fallback. A leading `/` is a url path
         * or an XPath, so each retry also checks for a matching element.
         */
        if (target.includes('://') || target.startsWith('/') || /^[A-Fa-f0-9-]{16,}$/.test(target)) {
            const mayBeXPath = target.startsWith('/')
            const waited = await this.waitUntil(
                async () => (
                    (await frameFromTree(this, target)) ||
                    (mayBeXPath && await selectorExists(this, target)) ||
                    false
                ),
                {
                    timeout: this.options.waitforTimeout,
                    interval: this.options.waitforInterval,
                    timeoutMsg: `Could not find a frame for "${target}"`
                }
            ).catch(() => undefined)
            if (waited && waited !== true) {
                return waited
            }
        } else {
            /**
             * Anything else reads as a selector first, so `frame('iframe')`
             * is the iframe element on this page, not a frame whose url
             * happens to contain "iframe". Only a frame element counts: a
             * selector that finds something else falls back to the url
             * substring, so `frame('results')` still finds `/results.html`.
             */
            const element = await existingElement(this, target)
            if (element && ['iframe', 'frame'].includes(await element.getTagName())) {
                return frameFromElement(this, element)
            }
        }
        const fromTree = await frameFromTree(this, target)
        if (fromTree) {
            return fromTree
        }
        const element = await this.$(target) as unknown as WebdriverIO.Element
        return frameFromElement(this, element)
    }
    throw new Error('`frame` expects a selector, an element, a url, a context id, or a function')
}

/**
 * A plain object with exactly one of `selector`, `url` or `id`. Elements and
 * chainable element promises are never plain objects.
 */
function isFrameQuery (target: unknown): target is FrameQuery {
    if (!target || typeof target !== 'object' || Object.getPrototypeOf(target) !== Object.prototype) {
        return false
    }
    const keys = Object.keys(target)
    return keys.length === 1 && ['selector', 'url', 'id'].includes(keys[0])
}

async function frameByQuery (
    caller: WebdriverIO.BrowsingContext,
    query: FrameQuery
): Promise<WebdriverIO.BrowsingContext> {
    if ('selector' in query) {
        if (typeof query.selector !== 'string') {
            throw new Error('`frame({ selector })` expects a string selector')
        }
        return frameFromElement(caller, await caller.$(query.selector) as unknown as WebdriverIO.Element)
    }
    let matches: (node: ContextNode) => boolean
    let description: string
    if ('id' in query) {
        if (typeof query.id !== 'string') {
            throw new Error('`frame({ id })` expects a browsing context id string')
        }
        matches = (node) => node.context === query.id
        description = `id "${query.id}"`
    } else {
        const { url } = query
        if (typeof url !== 'string' && !(url instanceof RegExp)) {
            throw new Error('`frame({ url })` expects a string or a RegExp')
        }
        matches = typeof url === 'string'
            ? (node) => node.url === url
            : (node) => {
                url.lastIndex = 0
                return url.test(node.url)
            }
        description = `url ${typeof url === 'string' ? `"${url}"` : String(url)}`
    }
    const found = await caller.waitUntil(
        async () => (await findInTree(caller, await childNodes(caller), matches)) || false,
        {
            timeout: caller.options.waitforTimeout,
            interval: caller.options.waitforInterval,
            timeoutMsg: `Could not find a frame with ${description}`
        }
    ).catch(() => undefined)
    if (!found) {
        throw new Error(`Could not find a frame with ${description}`)
    }
    return found
}

async function frameFromElement (
    parent: WebdriverIO.BrowsingContext,
    element: WebdriverIO.Element
): Promise<WebdriverIO.BrowsingContext> {
    await element.waitForExist({
        timeoutMsg: `Can't find a frame with selector ${element.selector} because it doesn't exist`
    })
    const result = await parent.execute(
        (iframe: HTMLIFrameElement) => iframe.contentWindow,
        element
    ) as { context?: string } | null
    const contextId = result && typeof result === 'object' ? result.context : undefined
    if (!contextId) {
        throw new Error('The element is not a frame with a browsing context')
    }
    return getBrowsingContext(parent.browser, contextId, {
        isFrame: true,
        parent,
        url: ''
    })
}

/**
 * The element `selector` finds right now, if any. An invalid selector is not
 * an element. A selector that matches several elements is ambiguous, so the
 * strict selector error is rethrown instead of guessing.
 */
async function existingElement (
    caller: WebdriverIO.BrowsingContext,
    selector: string
): Promise<WebdriverIO.Element | undefined> {
    try {
        const element = await caller.$(selector) as unknown as WebdriverIO.Element
        return await element.isExisting() ? element : undefined
    } catch (err) {
        if (err instanceof StrictSelectorError) {
            throw err
        }
        return undefined
    }
}

async function selectorExists (
    caller: WebdriverIO.BrowsingContext,
    selector: string
): Promise<boolean> {
    try {
        const element = await caller.$(selector) as unknown as WebdriverIO.Element
        return await element.isExisting()
    } catch {
        return false
    }
}

async function frameFromTree (
    caller: WebdriverIO.BrowsingContext,
    target: string
): Promise<WebdriverIO.BrowsingContext | undefined> {
    const children = await childNodes(caller)
    return findInTree(caller, children, (node) => (
        node.context === target || node.url === target || node.url.includes(target)
    ), (node) => node.context === target ? 0 : node.url === target ? 1 : 2)
}

async function frameByPredicate (
    caller: WebdriverIO.BrowsingContext,
    predicate: FramePredicate
): Promise<WebdriverIO.BrowsingContext> {
    const browser = caller.browser
    const functionDeclaration = createBidiFunctionDeclaration(predicate as unknown as Function)
    const match = await caller.waitUntil(async () => {
        const children = await childNodes(caller)
        return (await findInTree(caller, children, async (node) => {
            const result = await browser.scriptCallFunction({
                functionDeclaration,
                awaitPromise: true,
                arguments: [
                    LocalValue.getArgument({ context: node.context, url: node.url }) as remote.ScriptLocalValue
                ],
                target: { context: node.context }
            }).catch(() => undefined)
            return Boolean(result && result.type === 'success' && result.result.type === 'boolean' && result.result.value)
        })) || false
    }, {
        timeout: caller.options.waitforTimeout,
        interval: caller.options.waitforInterval,
        timeoutMsg: 'No frame matched the given function'
    }).catch(() => undefined)
    if (!match) {
        throw new Error('No frame matched the given function')
    }
    return match
}

/**
 * Prefer an exact context id, then an exact url, then a url substring.
 * `rank` is only set for that string search. A predicate returns the first match.
 */
async function findInTree (
    parent: WebdriverIO.BrowsingContext,
    nodes: ContextNode[],
    matches: (node: ContextNode) => boolean | Promise<boolean>,
    rank?: (node: ContextNode) => number
): Promise<WebdriverIO.BrowsingContext | undefined> {
    let best: { context: WebdriverIO.BrowsingContext, rank: number } | undefined
    await walk(parent, nodes)
    return best?.context

    async function walk (owner: WebdriverIO.BrowsingContext, level: ContextNode[]): Promise<boolean> {
        for (const node of level) {
            const context = getBrowsingContext(owner.browser, node.context, {
                isFrame: true,
                parent: owner,
                url: node.url
            })
            if (await matches(node)) {
                const score = rank ? rank(node) : 0
                if (!best || score < best.rank) {
                    best = { context, rank: score }
                }
                if (!rank) {
                    return true
                }
            }
            if (node.children?.length && await walk(context, node.children)) {
                return true
            }
        }
        return false
    }
}

async function childNodes (parent: WebdriverIO.BrowsingContext): Promise<ContextNode[]> {
    const { contexts } = await parent.browser.browsingContextGetTree({
        root: parent.contextId
    })
    return (contexts[0]?.children ?? []) as ContextNode[]
}
