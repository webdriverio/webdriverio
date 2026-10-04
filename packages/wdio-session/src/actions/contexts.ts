import logger from '@wdio/logger'
import { getWdioKind } from '@wdio/utils'
import { getContextManager } from 'webdriverio'

import { SessionError, usage } from '../errors.js'
import { quote } from '../quote.js'
import { resolveTarget } from '../snapshot/target.js'
import type { ActionFn, ActionOutcome, Session } from '../session.js'

const log = logger('@wdio/session:contexts')

interface Tab {
    index: number
    handle: string
    title: string
    url: string
    current: boolean
}

interface OpenDialog {
    type: string
    message: string
    defaultValue?: string
    accept: (text?: string) => Promise<void>
    dismiss: () => Promise<void>
}

const done = (text: string, code: string): ActionOutcome => ({ text, code, history: code })

async function listTabs (session: Session): Promise<Tab[]> {
    const { browser } = session
    const current = await browser.getWindowHandle()
    const handles = await browser.getWindowHandles()
    const tabs: Tab[] = []
    if (session.isBidi) {
        const tree = await browser.browsingContextGetTree({ maxDepth: 0 })
        const urls = new Map(tree.contexts.map((c) => [c.context, c.url]))
        for (const [index, handle] of handles.entries()) {
            const title = await browser.scriptEvaluate({ expression: 'document.title', target: { context: handle }, awaitPromise: false })
                .then((res) => res.type === 'success' && res.result.type === 'string' ? res.result.value : '')
                .catch(() => '')
            tabs.push({ index, handle, title, url: urls.get(handle) || '', current: handle === current })
        }
        return tabs
    }
    for (const [index, handle] of handles.entries()) {
        await browser.switchToWindow(handle)
        tabs.push({ index, handle, title: await browser.getTitle(), url: await browser.getUrl(), current: handle === current })
    }
    await browser.switchToWindow(current)
    return tabs
}

function formatTabs (tabs: Tab[]) {
    return tabs.map((t) => `[${t.index}]${t.current ? '*' : ' '} ${t.title || '(no title)'} — ${t.url}`).join('\n')
}

function findTab (tabs: Tab[], arg: unknown) {
    const value = String(arg ?? '')
    if (!value) {
        throw usage('Pass a tab index or handle.', 'Run `wdio session tabs` to list them.')
    }
    const tab = /^\d+$/.test(value) ? tabs[Number(value)] : tabs.find((t) => t.handle === value)
    if (!tab) {
        throw usage(`No tab ${value}.`, 'Run `wdio session tabs` to list them.')
    }
    return tab
}

interface ContextVars {
    /** context id → variable that holds it in the recorded code */
    names: Record<string, string>
    used: string[]
    generation?: number
}

/**
 * Recorded steps share one function scope in an exported spec. Each held
 * browsing context gets its own variable, declared once and reused by later
 * steps. The registry starts over when the history is cleared, and skips
 * names a kept history already declares.
 */
function contextVars (session: Session): ContextVars {
    const generation = session.history?.generation
    const vars = session.get<ContextVars>('contextVars')
    if (vars && vars.generation === generation) {
        return vars
    }
    const declared = (session.history?.entries ?? [])
        .flatMap((entry) => [...entry.code.matchAll(/\bconst ((?:page|frame)\d*) =/g)].map((match) => match[1]))
    const fresh: ContextVars = { names: {}, used: declared, generation }
    session.set('contextVars', fresh)
    return fresh
}

/**
 * The variable for a context and the code that declares it. The code is
 * empty when an earlier step already declared it.
 */
async function declareContext (
    session: Session,
    prefix: 'page' | 'frame',
    contextId: string,
    expression: () => string | Promise<string>
) {
    const vars = contextVars(session)
    const known = vars.names[contextId]
    if (known) {
        return { name: known, code: '' }
    }
    const value = await expression()
    let name: string = prefix
    for (let n = 2; vars.used.includes(name); n++) {
        name = `${prefix}${n}`
    }
    vars.used.push(name)
    vars.names[contextId] = name
    return { name, code: `const ${name} = ${value}` }
}

function forgetContext (session: Session, contextId: string) {
    delete contextVars(session).names[contextId]
}

/**
 * Window handles change between runs, so the emitted code finds a page by
 * URL. Tabs that share a URL are told apart by their order in the tree.
 */
async function pageExpression (session: Session, contextId: string, fallbackUrl: string) {
    const pages = await session.browser.browsingContexts().catch(() => [] as WebdriverIO.BrowsingContext[])
    const url = pages.find((page) => page.contextId === contextId)?.url || fallbackUrl
    const same = pages.filter((page) => page.url === url)
    const index = same.findIndex((page) => page.contextId === contextId)
    const match = `(context) => context.url === ${quote(url)}`
    return same.length > 1 && index >= 0
        ? `(await browser.browsingContexts()).filter(${match})[${index}]!`
        : `(await browser.browsingContexts()).find(${match})!`
}

const declarePage = (session: Session, contextId: string, url: string) =>
    declareContext(session, 'page', contextId, () => pageExpression(session, contextId, url))

const switchCode = async (session: Session, tab: Tab) => session.isBidi
    ? (await declarePage(session, tab.handle, tab.url)).code
    : `await browser.switchWindow(${quote(tab.url)})`

const joinCode = (...lines: string[]) => lines.filter(Boolean).join('\n')

function resetFrame (session: Session) {
    session.set('frame', undefined)
    session.set('frameStack', [])
}

async function switchTo (session: Session, tab: Tab) {
    await session.browser.switchToWindow(tab.handle)
    resetFrame(session)
    session.set('activeContext', undefined)
}

async function focusNewContext (session: Session, opened: unknown) {
    /**
     * in a BiDi session `newWindow()` gives a browsing context, see `@wdio/utils` `kind.ts`
     */
    if (!session.isBidi || getWdioKind(opened) !== 'browsing-context') {
        return
    }
    const contextId = (opened as WebdriverIO.BrowsingContext).contextId
    await session.browser.switchToWindow(contextId)
    getContextManager(session.browser).setCurrentContext(contextId)
}

export const tabs: ActionFn = async (session, args) => {
    const sub = args.sub as string | undefined
    if (!sub) {
        const list = await listTabs(session)
        return { text: formatTabs(list), data: { tabs: list } }
    }
    if (sub === 'new') {
        const url = (args.arg as string | undefined) || 'about:blank'
        const opened = await session.browser.newWindow(url)
        await focusNewContext(session, opened)
        resetFrame(session)
        const list = await listTabs(session)
        return { ...done(`Opened tab [${list.length - 1}] ${url}`, `await browser.newWindow(${quote(url)})`), data: { tabs: list } }
    }
    const list = await listTabs(session)
    const tab = findTab(list, args.arg)
    if (sub === 'switch') {
        await switchTo(session, tab)
        return { ...done(`Switched to tab [${tab.index}] ${tab.title || tab.url}`, await switchCode(session, tab)), data: { tab } }
    }
    if (list.length === 1) {
        throw usage('Cannot close the last tab.', 'Use `wdio session close` to end the session.')
    }
    const current = list.find((t) => t.current)!
    /**
     * Declare the closing page while it is still in the tree, so a page
     * that shares its URL with another tab is found by its position.
     */
    const registry = structuredClone(contextVars(session))
    const closed = session.isBidi ? await declarePage(session, tab.handle, tab.url) : undefined
    try {
        await session.browser.switchToWindow(tab.handle)
        await session.browser.closeWindow()
    } catch (err) {
        /**
         * No step is recorded, so the page variable was never declared.
         */
        session.set('contextVars', registry)
        throw err
    }
    const next = tab.current ? list.find((t) => t.handle !== tab.handle)! : current
    await switchTo(session, next)
    let code: string
    if (closed) {
        /**
         * A held page closes itself. `browser.closeWindow()` would close
         * whichever tab the session pointer is on when the spec replays.
         */
        forgetContext(session, tab.handle)
        code = joinCode(closed.code, `await ${closed.name}.closeWindow()`, await switchCode(session, next))
    } else {
        code = joinCode(await switchCode(session, tab), 'await browser.closeWindow()', await switchCode(session, next))
    }
    return {
        ...done(`Closed tab [${tab.index}] ${tab.title || tab.url}, now on ${next.title || next.url}`, code),
        data: { tabs: await listTabs(session) }
    }
}

export const windows: ActionFn = async (session, args) => {
    if (args.sub && args.sub !== 'switch') {
        throw usage(`Unknown windows command "${args.sub}".`, 'Use `wdio session windows` or `wdio session windows switch <index>`.')
    }
    return tabs(session, args)
}

export const frame: ActionFn = async (session, args) => {
    const target = String(args.target ?? '')
    const { browser } = session
    if (session.isBidi) {
        return frameBidi(session, target)
    }
    if (target === 'top') {
        await browser.switchFrame(null)
        resetFrame(session)
        return done('Switched to the top document', 'await browser.switchFrame(null)')
    }
    if (target === 'parent') {
        await browser.switchToParentFrame()
        const stack = session.get<string[]>('frameStack') || []
        stack.pop()
        session.set('frameStack', stack)
        session.set('frame', stack.at(-1))
        return done(`Switched to ${stack.at(-1) || 'the top document'}`, 'await browser.switchToParentFrame()')
    }
    const resolved = await resolveTarget(session, target)
    const tag = await resolved.element.getTagName().catch(() => '')
    if (!['iframe', 'frame'].includes(tag.toLowerCase())) {
        throw usage(`${resolved.label} is not a frame.`, 'Pass the ref of an iframe from `wdio session snapshot`.')
    }
    await browser.switchFrame(resolved.element)
    const stack = [...(session.get<string[]>('frameStack') || []), resolved.label]
    session.set('frameStack', stack)
    session.set('frame', resolved.label)
    return done(`Switched to frame ${resolved.label}`, `await browser.switchFrame(${resolved.code})`)
}

async function currentPage (session: Session) {
    const held = session.get<WebdriverIO.BrowsingContext>('activeContext')
    if (held && !held.isFrame) {
        return held
    }
    const contexts = await session.browser.browsingContexts()
    const handle = await session.browser.getWindowHandle()
    return contexts.find((context) => context.contextId === handle) ?? contexts[0]
}

async function declareCurrentPage (session: Session, page: WebdriverIO.BrowsingContext) {
    const url = await page.getUrl().catch(() => page.url)
    return declarePage(session, page.contextId, url)
}

/**
 * The variable for a held context, declaring it and any undeclared parent
 * on the way. A frame no earlier step declared, e.g. after the history was
 * cleared, is found in its parent by URL.
 */
async function declareHeld (session: Session, context: WebdriverIO.BrowsingContext): Promise<{ name?: string, code: string }> {
    if (!context.isFrame) {
        return declareCurrentPage(session, context)
    }
    const known = contextVars(session).names[context.contextId]
    if (known) {
        return { name: known, code: '' }
    }
    if (!context.parent) {
        return { code: '' }
    }
    const owner = await declareHeld(session, context.parent)
    if (!owner.name) {
        return { code: '' }
    }
    const url = await context.getUrl().catch(() => context.url)
    if (!url) {
        return { code: owner.code }
    }
    const lookup = await frameLookup(session, context, url)
    if (!lookup) {
        return { code: owner.code }
    }
    const own = await declareContext(session, 'frame', context.contextId, () => `await ${owner.name}.frame(${lookup(owner.name!)})`)
    return { name: own.name, code: joinCode(owner.code, own.code) }
}

/**
 * How to find a held frame in its parent. A URL is enough when no sibling
 * shares it. Otherwise the frame is found by its position in the same
 * `$$('iframe, frame')` query the recorded code runs, so frames in shadow
 * roots are counted the same way during recording and replay.
 */
async function frameLookup (session: Session, context: WebdriverIO.BrowsingContext, url: string) {
    const parent = context.parent!
    const { contexts } = await session.browser.browsingContextGetTree({ root: parent.contextId, maxDepth: 1 })
    const siblings = contexts[0]?.children ?? []
    if (siblings.filter((child) => child.url === url).length <= 1) {
        return () => quote(url)
    }
    const frames: WebdriverIO.Element[] = Array.from(
        await parent.$$('iframe, frame').getElements().catch(() => [] as WebdriverIO.Element[])
    )
    for (const [index, element] of frames.entries()) {
        const window = await parent.execute((frame: HTMLIFrameElement) => frame.contentWindow, element)
            .catch(() => undefined) as { context?: string } | null | undefined
        if (window?.context === context.contextId) {
            return (name: string) => `${name}.$$('iframe, frame')[${index}]`
        }
    }
    return undefined
}

function adopt (session: Session, contextId: string) {
    getContextManager(session.browser).setCurrentContext(contextId)
}

async function frameBidi (session: Session, target: string): Promise<ActionOutcome> {
    if (target === 'top') {
        const handle = await session.browser.getWindowHandle()
        adopt(session, handle)
        session.set('activeContext', undefined)
        resetFrame(session)
        const page = await currentPage(session)
        return done('Switched to the top document', page ? (await declareCurrentPage(session, page)).code : '')
    }
    if (target === 'parent') {
        const current = session.get<WebdriverIO.BrowsingContext>('activeContext')
        const parent = current?.parent
        const stack = session.get<string[]>('frameStack') || []
        stack.pop()
        session.set('frameStack', stack)
        let code = ''
        if (parent?.isFrame) {
            session.set('activeContext', parent)
            session.set('frame', stack.at(-1))
            code = (await declareHeld(session, parent)).code
        } else {
            const handle = await session.browser.getWindowHandle()
            adopt(session, handle)
            session.set('activeContext', undefined)
            session.set('frame', undefined)
            const page = await currentPage(session)
            code = page ? (await declareCurrentPage(session, page)).code : ''
        }
        return done(`Switched to ${stack.at(-1) || 'the top document'}`, code)
    }
    const resolved = await resolveTarget(session, target)
    const tag = await resolved.element.getTagName().catch(() => '')
    if (!['iframe', 'frame'].includes(tag.toLowerCase())) {
        throw usage(`${resolved.label} is not a frame.`, 'Pass the ref of an iframe from `wdio session snapshot`.')
    }
    const owner = session.get<WebdriverIO.BrowsingContext>('activeContext') ?? await currentPage(session)
    if (!owner) {
        throw usage('No browsing context to enter a frame from.')
    }
    const child = await owner.frame(resolved.element).catch(async (err: Error) => {
        /**
         * The frame's context is found by evaluating `iframe.contentWindow` in
         * the parent page, which throws for some cross-site frames (site
         * isolation). The frame's own URL identifies it just as well.
         */
        if (!/SecurityError|cross-origin frame/i.test(`${err.name} ${err.message}`)) {
            throw err
        }
        const src = await resolved.element.getProperty('src').catch(() => '') as string
        if (!src) {
            throw err
        }
        // only when the URL names this frame alone: another frame with it would be picked as well
        const sameSrc = await resolved.element.execute((el: Element) => Array.from((el.getRootNode() as Document | ShadowRoot).querySelectorAll('iframe, frame'))
            .filter((frame) => (frame as HTMLIFrameElement).src === (el as HTMLIFrameElement).src).length) as number
        if (sameSrc !== 1) {
            throw usage(
                `${resolved.label} can't be entered: the browser blocks looking into it, and ${sameSrc} frames on the page load ${src}.`,
                'Run `wdio session exec` with `browser.switchFrame(...)` on a selector that matches only this frame.'
            )
        }
        const withoutHash = (url: string) => url.split('#')[0]
        return owner.frame(({ url }) => withoutHash(url) === withoutHash(src))
    })
    /**
     * The frame element belongs to the owner's document, so the recorded
     * selector is queried on the owner, not on the top-level page.
     */
    const ownerVar = await declareHeld(session, owner)
    const childVar = ownerVar.name
        ? await declareContext(session, 'frame', child.contextId, () => `await ${ownerVar.name}.frame(${ownerVar.name}.${resolved.code})`)
        : { code: '' }
    session.set('activeContext', child)
    const stack = [...(session.get<string[]>('frameStack') || []), resolved.label]
    session.set('frameStack', stack)
    session.set('frame', resolved.label)
    return done(`Switched to frame ${resolved.label}`, joinCode(ownerVar.code, childVar.code))
}

export const contexts: ActionFn = async (session, args) => {
    const { browser } = session
    if (args.sub === 'switch') {
        const name = String(args.name ?? '')
        if (!name) {
            throw usage('Pass a context name.', 'Run `wdio session contexts` to list them.')
        }
        await browser.switchContext(name)
        return done(`Switched to ${name}`, `await browser.switchContext(${quote(name)})`)
    }
    const current = await browser.getContext().catch(() => undefined)
    const currentName = typeof current === 'string' ? current : (current as { id?: string } | undefined)?.id
    const list = await browser.getContexts({ returnDetailedContexts: true }) as (string | { id: string, title?: string, url?: string })[]
    const items = list.map((c) => typeof c === 'string' ? { id: c } : c)
    const text = items.map((c) => `${c.id === currentName ? '*' : ' '} ${c.id}${c.title ? ` — ${c.title}` : ''}${c.url ? ` ${c.url}` : ''}`).join('\n')
    return { text, data: { contexts: items, current: currentName } }
}

/**
 * Keep track of the open dialog. Registering a `dialog` listener turns off
 * WebdriverIO's automatic dismissal, so the page stays blocked until the
 * user runs `wdio session dialog accept|dismiss`.
 */
export async function trackDialogs (session: Session) {
    const { browser } = session
    if (!session.isBidi || !session.isWeb || session.applies.includes('M')) {
        return
    }
    const onDialog = (dialog: { type: () => string, message: () => string, defaultValue: () => string | undefined, accept: (t?: string) => Promise<void>, dismiss: () => Promise<void> }) => {
        const open: OpenDialog = {
            type: dialog.type(),
            message: dialog.message(),
            defaultValue: dialog.defaultValue(),
            accept: (text) => dialog.accept(text),
            dismiss: () => dialog.dismiss()
        }
        log.info(`Dialog opened: ${open.type} "${open.message}"`)
        session.logs.push({ time: Date.now(), level: 'info', source: 'dialog', text: `${open.type} ${JSON.stringify(open.message)}` })
        session.set('dialog', open)
    }
    const onClosed = () => session.set('dialog', undefined)
    browser.on('dialog', onDialog)
    await browser.sessionSubscribe({ events: ['browsingContext.userPromptClosed'] }).catch(() => {})
    browser.on('browsingContext.userPromptClosed', onClosed)
    session.disposers.push(() => {
        browser.off('dialog', onDialog)
        browser.off('browsingContext.userPromptClosed', onClosed)
    })
}

export function openDialog (session: Session) {
    return session.get<OpenDialog>('dialog')
}

export function dialogOpenError (dialog: OpenDialog) {
    const article = /^[aeiou]/i.test(dialog.type) ? 'An' : 'A'
    return new SessionError('DIALOG_OPEN', `${article} ${dialog.type} dialog is open: ${JSON.stringify(dialog.message)}`, {
        hint: `Run \`wdio session dialog accept${dialog.type === 'prompt' ? ' --text <answer>' : ''}\` or \`wdio session dialog dismiss\` first.`
    })
}

const noDialog = () => new SessionError('NOT_SUPPORTED', 'No dialog open.')

export const dialog: ActionFn = async (session, args) => {
    if (args.sub === 'status') {
        const open = openDialog(session)
        if (open) {
            return {
                text: `${open.type}: ${JSON.stringify(open.message)}`,
                data: {
                    open: true,
                    type: open.type,
                    message: open.message,
                    ...(open.defaultValue !== undefined ? { defaultValue: open.defaultValue } : {})
                }
            }
        }
        const message = await session.browser.getAlertText().catch(() => undefined)
        if (message === undefined) {
            return { text: 'No dialog open', data: { open: false } }
        }
        return { text: `alert: ${JSON.stringify(message)}`, data: { open: true, type: 'alert', message } }
    }
    const accept = args.sub === 'accept'
    const text = typeof args.text === 'string' ? args.text : undefined
    if (!accept && text !== undefined) {
        throw usage('--text only works with `dialog accept`.')
    }
    const { browser } = session
    if (session.applies.includes('M')) {
        await (accept ? browser.acceptAlert() : browser.dismissAlert()).catch((err: Error) => {
            throw /no such alert|no alert/i.test(err.message) ? noDialog() : err
        })
        return done(accept ? 'Accepted the dialog' : 'Dismissed the dialog', `await browser.${accept ? 'acceptAlert' : 'dismissAlert'}()`)
    }
    const open = openDialog(session)
    const listener = accept
        ? `browser.once('dialog', (dialog) => dialog.accept(${text === undefined ? '' : quote(text)}))`
        : "browser.once('dialog', (dialog) => dialog.dismiss())"
    if (open) {
        await (accept ? open.accept(text) : open.dismiss())
        session.set('dialog', undefined)
        return done(`${accept ? 'Accepted' : 'Dismissed'} ${open.type} ${JSON.stringify(open.message)}`, listener)
    }
    const message = await browser.getAlertText().catch(() => undefined)
    if (message === undefined) {
        throw noDialog()
    }
    if (accept && text !== undefined) {
        await browser.sendAlertText(text)
    }
    await (accept ? browser.acceptAlert() : browser.dismissAlert())
    return done(`${accept ? 'Accepted' : 'Dismissed'} dialog ${JSON.stringify(message)}`, `await browser.${accept ? 'acceptAlert' : 'dismissAlert'}()`)
}
