import type { remote } from 'webdriver'

import type { ChainablePromiseElement } from '../../types.js'
import { createBidiFunctionDeclaration } from '../../utils/bidi/serialize.js'
import { LocalValue } from '../../utils/bidi/value.js'
import { getBrowsingContext } from '../../browsingContext.js'
import { StrictSelectorError } from '../../utils/strictSelectorError.js'

type FrameTarget = string | WebdriverIO.Element | ChainablePromiseElement | FramePredicate

type FramePredicate = (context: { context: string, url: string }) => boolean | Promise<boolean>

interface ContextNode {
    context: string
    url: string
    children?: ContextNode[]
}

/**
 * A child browsing context of this one: a frame element, a selector that
 * finds one, a frame url (or a substring of it), a context id, or a
 * predicate run in each descendant. `parent` on the result is the context
 * this was called on for a direct child, or the intermediate frame when
 * the match is nested.
 */
export async function frame (
    this: WebdriverIO.BrowsingContext,
    target: FrameTarget
): Promise<WebdriverIO.BrowsingContext> {
    if (typeof target === 'function') {
        return frameByPredicate(this, target)
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
             * happens to contain "iframe". A url substring is the fallback.
             */
            const element = await existingElement(this, target)
            if (element) {
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
