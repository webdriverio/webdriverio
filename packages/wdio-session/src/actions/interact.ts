import fs from 'node:fs'
import path from 'node:path'

import { UNICODE_CHARACTERS } from '@wdio/utils'

import { usage } from '../errors.js'
import { quote } from '../quote.js'
import { resolveTarget } from '../snapshot/target.js'
import type { ActionFn, ActionOutcome, Session } from '../session.js'

const DEFAULT_SCROLL_PX = 600
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

const done = (text: string, code: string): ActionOutcome => ({ text, code, history: code })

const KEY_NAMES = new Map<string, string>()
for (const key of Object.keys(UNICODE_CHARACTERS)) {
    const id = key.toLowerCase().replace(/\s+/g, '')
    if (!KEY_NAMES.has(id)) {
        KEY_NAMES.set(id, key)
    }
}
const KEY_ALIASES: Record<string, string> = {
    ctrl: 'Control',
    cmd: 'Command',
    esc: 'Escape',
    del: 'Delete',
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    option: 'Alt',
    return: 'Enter',
    plus: '+'
}

/**
 * Split `Control+Shift+a` into WebdriverIO key names. Single characters are
 * kept as typed, named keys are matched case-insensitively.
 */
export function parseKeys (combo: string): string[] {
    if (!combo) {
        throw usage('No keys given.', 'Examples: Enter, Tab, Control+a, Shift+Tab')
    }
    const parts = combo === '+' ? ['+'] : combo.split(/(?<!^)\+(?!$)/)
    return parts.map((part) => {
        if (part.length === 1) {
            return part
        }
        const lower = part.toLowerCase()
        const name = KEY_ALIASES[lower] || KEY_NAMES.get(lower)
        if (!name) {
            throw usage(`Unknown key "${part}".`, 'Use key names like Enter, Tab, Escape, ArrowDown, Control, Shift, Alt, Meta or single characters.')
        }
        return name
    })
}

/**
 * Accept `example.com` as well as full URLs; relative paths go through
 * `baseUrl` handling of `browser.url`.
 */
export function normalizeUrl (url: string) {
    if (/^[a-z][a-z\d+.-]*:(?!\d)/i.test(url) || url.startsWith('/') || url.startsWith('.')) {
        return url
    }
    if (/^(localhost|[\w-]+(\.[\w-]+)+)(:\d+)?(\/|$|\?|#)/i.test(url)) {
        return `${/^localhost|^127\./i.test(url) ? 'http' : 'https'}://${url}`
    }
    return url
}

async function withNavigation (session: Session, text: string, fn: () => Promise<unknown>) {
    const before = await session.currentUrl()
    await fn()
    const after = await session.currentUrl()
    return after && before !== after ? `${text}\nNavigated to ${after}` : text
}

export const navigate: ActionFn = async (session, args) => {
    const url = normalizeUrl(String(args.url ?? ''))
    if (!url) {
        throw usage('No URL given.')
    }
    if (session.get('frame')) {
        await session.browser.switchFrame(null)
        session.set('frame', undefined)
        session.set('frameStack', [])
    }
    await session.browser.url(url)
    const title = await session.browser.getTitle().catch(() => '')
    const current = await session.currentUrl()
    return done(`Navigated to ${current || url}${title ? ` — ${title}` : ''}`, `await browser.url(${quote(url)})`)
}

const historyStep = (method: 'back' | 'forward' | 'refresh', verb: string): ActionFn => async (session) => {
    await session.browser[method]()
    const url = await session.currentUrl()
    return done(`${verb}${url ? ` → ${url}` : ''}`, `await browser.${method}()`)
}

export const back = historyStep('back', 'Went back')
export const forward = historyStep('forward', 'Went forward')
export const reload = historyStep('refresh', 'Reloaded')

export const click: ActionFn = async (session, args) => {
    const target = await resolveTarget(session, args.target)
    if (args.double && args.right) {
        throw usage('Use either --double or --right.')
    }
    if (args.newTab) {
        if (args.double || args.right) {
            throw usage('Use either --new-tab or --double/--right.')
        }
        const property = typeof target.element.getProperty === 'function'
            ? await target.element.getProperty('href')
            : undefined
        const href = typeof property === 'string' && property
            ? property
            : await target.element.getAttribute('href')
        if (!href) {
            throw usage(`${target.label} has no href.`, 'Pass a link, or click without --new-tab.')
        }
        const base = await session.currentUrl()
        const url = new URL(href, base || undefined).href
        await session.browser.newWindow(url, { type: 'tab' })
        if (session.get?.('frame')) {
            await session.browser.switchFrame(null)
        }
        session.set?.('frame', undefined)
        session.set?.('frameStack', [])
        return done(`Opened ${url} in a new tab`, `await browser.newWindow(${quote(url)}, { type: 'tab' })`)
    }
    const [verb, call, run] = args.double
        ? ['Double-clicked', 'doubleClick()', () => target.element.doubleClick()]
        : args.right
            ? ['Right-clicked', "click({ button: 'right' })", () => target.element.click({ button: 'right' })]
            : ['Clicked', 'click()', () => target.element.click()]
    const text = await withNavigation(session, `${verb} ${target.label}`, run)
    return done(text, `await ${target.code}.${call}`)
}

export const tap: ActionFn = async (session, args) => {
    const target = await resolveTarget(session, args.target)
    await target.element.tap()
    return done(`Tapped ${target.label}`, `await ${target.code}.tap()`)
}

export const fill: ActionFn = async (session, args) => {
    const target = await resolveTarget(session, args.target)
    const value = String(args.text ?? '')
    await target.element.setValue(value)
    return done(`Filled ${target.label}`, `await ${target.code}.setValue(${quote(value)})`)
}

export const type: ActionFn = async (session, args) => {
    const value = String(args.text ?? '')
    if (!value) {
        throw usage('No text given.')
    }
    await session.browser.keys(value)
    return done(`Typed ${value.length} character${value.length === 1 ? '' : 's'}`, `await browser.keys(${quote(value)})`)
}

export const press: ActionFn = async (session, args) => {
    const keys = parseKeys(String(args.keys ?? ''))
    const code = keys.length === 1
        ? `await browser.keys(${quote(keys[0])})`
        : `await browser.keys([${keys.map(quote).join(', ')}])`
    const text = await withNavigation(session, `Pressed ${keys.join('+')}`, () => session.browser.keys(keys.length === 1 ? keys[0] : keys))
    return done(text, code)
}

export const select: ActionFn = async (session, args) => {
    const target = await resolveTarget(session, args.target)
    const value = String(args.value ?? '')
    const by = (args.by as string | undefined) || 'text'
    let call: string
    if (by === 'index') {
        const index = Number(value)
        if (!Number.isInteger(index) || index < 0) {
            throw usage(`--by index needs a non-negative integer, got "${value}".`)
        }
        await target.element.selectByIndex(index)
        call = `selectByIndex(${index})`
    } else if (by === 'value') {
        await target.element.selectByAttribute('value', value)
        call = `selectByAttribute('value', ${quote(value)})`
    } else {
        await target.element.selectByVisibleText(value)
        call = `selectByVisibleText(${quote(value)})`
    }
    return done(`Selected ${JSON.stringify(value)} in ${target.label}`, `await ${target.code}.${call}`)
}

function isRemote (session: Session) {
    const host = session.plan.remote?.hostname
    return Boolean(session.plan.provider || (host && !LOCAL_HOSTS.has(host)))
}

export const upload: ActionFn = async (session, args) => {
    const file = path.resolve(String(args.$cwd || session.cwd), String(args.file ?? ''))
    if (!args.file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        throw usage(`File ${file} does not exist.`)
    }
    const target = await resolveTarget(session, args.target)
    if (isRemote(session)) {
        const remotePath = await session.browser.uploadFile(file)
        await target.element.setValue(remotePath)
        return done(
            `Uploaded ${path.basename(file)} to ${target.label}`,
            `const remotePath = await browser.uploadFile(${quote(file)})\nawait ${target.code}.setValue(remotePath)`
        )
    }
    await target.element.setValue(file)
    return done(`Set ${target.label} to ${path.basename(file)}`, `await ${target.code}.setValue(${quote(file)})`)
}

export const focus: ActionFn = async (session, args) => {
    const target = await resolveTarget(session, args.target)
    await session.browser.execute((el: HTMLElement) => el.focus(), target.element)
    return done(`Focused ${target.label}`, `await browser.execute((el) => el.focus(), ${target.code})`)
}

export const setChecked: ActionFn = async (session, args) => {
    const target = await resolveTarget(session, args.target)
    const want = args.uncheck !== true
    const selected = await target.element.isSelected()
    if (selected !== want) {
        await target.element.click()
    }
    const after = await target.element.isSelected()
    if (after !== want) {
        throw usage(
            `${target.label} is still ${after ? 'checked' : 'unchecked'}.`,
            want ? 'The control did not become checked.' : 'A selected radio button stays selected when it is clicked.'
        )
    }
    const verb = want ? 'Checked' : 'Unchecked'
    const guard = `if ((await ${target.code}.isSelected()) !== ${want}) {\n    await ${target.code}.click()\n}`
    return done(`${verb} ${target.label}`, guard)
}

export const check: ActionFn = async (session, args) => setChecked(session, { ...args, uncheck: false })
export const uncheck: ActionFn = async (session, args) => setChecked(session, { ...args, uncheck: true })

export const hover: ActionFn = async (session, args) => {
    const target = await resolveTarget(session, args.target)
    await target.element.moveTo()
    return done(`Hovered ${target.label}`, `await ${target.code}.moveTo()`)
}

export const drag: ActionFn = async (session, args) => {
    const from = await resolveTarget(session, args.from)
    const to = await resolveTarget(session, args.to)
    await from.element.dragAndDrop(to.element)
    return done(`Dragged ${from.label} onto ${to.label}`, `await ${from.code}.dragAndDrop(${to.code})`)
}

export const scroll: ActionFn = async (session, args) => {
    const where = (args.target as string | undefined) || 'down'
    const px = typeof args.px === 'number' ? args.px : DEFAULT_SCROLL_PX
    if (where === 'up' || where === 'down') {
        const dy = where === 'up' ? -px : px
        await session.browser.scroll(0, dy)
        return done(`Scrolled ${where} ${px}px`, `await browser.scroll(0, ${dy})`)
    }
    if (where === 'top' || where === 'bottom') {
        const fn = where === 'top'
            ? '() => window.scrollTo(0, 0)'
            : '() => window.scrollTo(0, document.documentElement.scrollHeight)'
        await session.browser.execute(where === 'top'
            ? () => window.scrollTo(0, 0)
            : () => window.scrollTo(0, document.documentElement.scrollHeight))
        return done(`Scrolled to the ${where}`, `await browser.execute(${fn})`)
    }
    const target = await resolveTarget(session, where)
    await target.element.scrollIntoView()
    return done(`Scrolled ${target.label} into view`, `await ${target.code}.scrollIntoView()`)
}

export const swipe: ActionFn = async (session, args) => {
    const direction = String(args.direction) as 'up' | 'down' | 'left' | 'right'
    const percent = typeof args.percent === 'number' ? args.percent : undefined
    if (percent !== undefined && (percent <= 0 || percent > 1)) {
        throw usage('--percent must be between 0 and 1.')
    }
    const options = percent === undefined ? `{ direction: '${direction}' }` : `{ direction: '${direction}', percent: ${percent} }`
    await session.browser.swipe(percent === undefined ? { direction } : { direction, percent })
    return done(`Swiped ${direction}`, `await browser.swipe(${options})`)
}

export const longPress: ActionFn = async (session, args) => {
    const target = await resolveTarget(session, args.target)
    const duration = typeof args.duration === 'number' ? args.duration : undefined
    await target.element.longPress(duration === undefined ? {} : { duration })
    return done(`Long-pressed ${target.label}`, `await ${target.code}.longPress(${duration === undefined ? '' : `{ duration: ${duration} }`})`)
}
