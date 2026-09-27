import logger from '@wdio/logger'

import { SessionError, usage } from '../errors.js'
import { quote } from '../daemon/init.js'
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

/**
 * window handles change between runs, emitted code matches by URL
 */
const switchCode = (tab: Tab) => `await browser.switchWindow(${quote(tab.url)})`

function resetFrame (session: Session) {
    session.set('frame', undefined)
    session.set('frameStack', [])
}

async function switchTo (session: Session, tab: Tab) {
    await session.browser.switchToWindow(tab.handle)
    resetFrame(session)
}

export const tabs: ActionFn = async (session, args) => {
    const sub = args.sub as string | undefined
    if (!sub) {
        const list = await listTabs(session)
        return { text: formatTabs(list), data: { tabs: list } }
    }
    if (sub === 'new') {
        const url = (args.arg as string | undefined) || 'about:blank'
        await session.browser.newWindow(url)
        resetFrame(session)
        const list = await listTabs(session)
        return { ...done(`Opened tab [${list.length - 1}] ${url}`, `await browser.newWindow(${quote(url)})`), data: { tabs: list } }
    }
    const list = await listTabs(session)
    const tab = findTab(list, args.arg)
    if (sub === 'switch') {
        await switchTo(session, tab)
        return { ...done(`Switched to tab [${tab.index}] ${tab.title || tab.url}`, switchCode(tab)), data: { tab } }
    }
    if (list.length === 1) {
        throw usage('Cannot close the last tab.', 'Use `wdio session close` to end the session.')
    }
    const current = list.find((t) => t.current)!
    await session.browser.switchToWindow(tab.handle)
    await session.browser.closeWindow()
    const next = tab.current ? list.find((t) => t.handle !== tab.handle)! : current
    await switchTo(session, next)
    const code = [switchCode(tab), 'await browser.closeWindow()', switchCode(next)]
    return {
        ...done(`Closed tab [${tab.index}] ${tab.title || tab.url}, now on ${next.title || next.url}`, code.join('\n')),
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
