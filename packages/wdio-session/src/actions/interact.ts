import fs from 'node:fs'
import path from 'node:path'

import { UNICODE_CHARACTERS, getWdioKind } from '@wdio/utils'
import { getContextManager } from 'webdriverio'

import { usage } from '../errors.js'
import { quote } from '../quote.js'
import { resolveTarget, scopeOf, type ResolvedTarget } from '../snapshot/target.js'
import { refId } from '../snapshot/refs.js'
import type { ActionFn, ActionOutcome, Session } from '../session.js'

const DEFAULT_SCROLL_PX = 600

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

const sameUrl = (a: string, b: string) => {
    try {
        return new URL(a).href === new URL(b, a).href
    } catch {
        return a === b
    }
}

/** how long a click or navigation waits for the page to finish loading */
export const PAGE_LOAD_TIMEOUT_MS = 20_000

const STILL_LOADING = 'The page is still loading; what is shown below is what has loaded so far.'

const isPageLoadTimeout = (err: unknown) => /timed out receiving message from renderer|page load timeout|^timeout$/i
    .test(`${(err as Error)?.name ?? ''}\n${(err as Error)?.message ?? ''}`)

/**
 * A navigation that is still loading after the session's page load limit
 * (see `PAGE_LOAD_TIMEOUT_MS`) is no failure for an agent: the page is there,
 * only its last ads and trackers are missing. Resolves `true` in that case.
 * A WebDriver BiDi navigation has no such limit, so it gets one here.
 */
export async function untilLoaded (navigation: Promise<unknown>): Promise<boolean> {
    let timer: NodeJS.Timeout | undefined
    const limit = new Promise<'loading'>((resolve) => { timer = setTimeout(() => resolve('loading'), PAGE_LOAD_TIMEOUT_MS) })
    try {
        return await Promise.race([navigation.then(() => false), limit.then(() => true)])
    } catch (err) {
        if (isPageLoadTimeout(err)) {
            return true
        }
        throw err
    } finally {
        clearTimeout(timer)
        // a navigation that loses the race may still fail later: nobody waits for it
        navigation.catch(() => {})
    }
}

/** how long `open` and `navigate` give a page to finish loading after its document is there */
const LOAD_GRACE_MS = 5_000

/**
 * Wait up to LOAD_GRACE_MS for the page's load event, in the page itself, so
 * nothing else is blocked meanwhile. Resolves whether the page finished.
 */
export async function waitForLoad (session: Session): Promise<boolean> {
    try {
        return await scopeOf(session).execute(function (limit: number) {
            return new Promise<boolean>((resolve) => {
                if (document.readyState === 'complete') {
                    return resolve(true)
                }
                const timer = setTimeout(() => resolve(false), limit)
                window.addEventListener('load', () => {
                    clearTimeout(timer)
                    resolve(true)
                }, { once: true })
            })
        }, LOAD_GRACE_MS) as boolean
    } catch {
        // the page navigated again meanwhile: whatever is there now is shown
        return true
    }
}

async function withNavigation (session: Session, text: string, fn: () => Promise<unknown>) {
    const before = await session.currentUrl()
    let loading = await untilLoaded(fn())
    const after = await session.currentUrl()
    const navigated = Boolean(after && before !== after)
    if (navigated && !loading) {
        loading = !await waitForLoad(session)
    }
    const reported = navigated ? `${text}\nNavigated to ${after}` : text
    return loading ? `${reported}\n${STILL_LOADING}` : reported
}

export const navigate: ActionFn = async (session, args) => {
    const url = normalizeUrl(String(args.url ?? ''))
    if (!url) {
        throw usage('No URL given.')
    }
    if (session.get('frame')) {
        if (session.isBidi) {
            const handle = await session.browser.getWindowHandle()
            getContextManager(session.browser).setCurrentContext(handle)
        } else {
            await session.browser.switchFrame(null)
        }
        session.set('frame', undefined)
        session.set('frameStack', [])
        session.set('activeContext', undefined)
    }
    const before = await session.currentUrl()
    const timedOut = await untilLoaded(session.browser.url(url))
    let loading = timedOut || !await waitForLoad(session)
    let current = await session.currentUrl()
    /**
     * A navigation the page started itself a moment before (a click that
     * leads somewhere, a redirect) can win the race: then the page is still
     * where it was. The requested navigation goes after it. Only when the
     * first one finished: one that is still under way is just slow.
     */
    if (!timedOut && before && current === before && !sameUrl(before, url)) {
        loading = await untilLoaded(session.browser.url(url)) || !await waitForLoad(session)
        current = await session.currentUrl()
        // the browser reports a refused connection (net::ERR_ABORTED) like a raced navigation
        if (current === before) {
            throw usage(
                `${url} did not open; the page is still ${before}.`,
                'The site may have refused the connection (bot protection) or the address may be wrong. Try again later, or open another page.'
            )
        }
    }
    const title = await session.browser.getTitle().catch(() => '')
    return done(`Navigated to ${current || url}${title ? ` — ${title}` : ''}${loading ? `\n${STILL_LOADING}` : ''}`, `await browser.url(${quote(url)})`)
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
        const opened = await session.browser.newWindow(url, { type: 'tab' })
        /**
         * in a BiDi session `newWindow()` gives a browsing context, see `@wdio/utils` `kind.ts`
         */
        if (session.isBidi && getWdioKind(opened) === 'browsing-context') {
            const { contextId } = opened as WebdriverIO.BrowsingContext
            await session.browser.switchToWindow(contextId)
            getContextManager(session.browser).setCurrentContext(contextId)
        }
        if (session.get?.('frame') && !session.isBidi) {
            await session.browser.switchFrame(null)
        }
        session.set?.('frame', undefined)
        session.set?.('frameStack', [])
        session.set?.('activeContext', undefined)
        return done(`Opened ${url} in a new tab`, `await browser.newWindow(${quote(url)}, { type: 'tab' })`)
    }
    const [verb, call, run] = args.double
        ? ['Double-clicked', 'doubleClick()', () => target.element.doubleClick()]
        : args.right
            ? ['Right-clicked', "click({ button: 'right' })", () => target.element.click({ button: 'right' })]
            : ['Clicked', 'click()', () => clickChecked(session, target)]
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
    await withPointerFallback(session, target, () => target.element.setValue(value), async () => {
        await target.element.execute((el) => (el as unknown as HTMLInputElement).select?.())
        await session.browser.keys(value)
    })
    return done(`Filled ${target.label}`, `await ${target.code}.setValue(${quote(value)})`)
}

interface ClickPoint {
    state: 'ok' | 'hidden' | 'covered' | 'label'
    x: number
    y: number
    /** what covers the element: role or tag and its text */
    cover?: string
    /** where a hidden link goes */
    href?: string
}

/**
 * Where a click on the element would land, asked once before clicking. The
 * driver otherwise finds out by failing, retrying and waiting several seconds
 * for the element to become clickable, which a hidden or covered element
 * never does, and then reports only the element's HTML.
 *
 * - hidden: not rendered, zero-sized or `visibility: hidden` (a link in a closed menu, a tab panel
 *   that isn't shown). A hidden radio button or checkbox whose label is
 *   visible is clicked through its label, like a person does with the custom
 *   styled controls many sites use.
 * - covered: something else is at the element's center (a cookie banner, a
 *   dialog, a sticky header).
 */
async function clickPoint (target: ResolvedTarget): Promise<ClickPoint> {
    return target.element.execute((el: Element) => {
        const visible = (node: Element) => {
            const rect = node.getBoundingClientRect()
            const style = getComputedStyle(node)
            // opacity 0 is no reason: transparent inputs laid over styled buttons take real clicks
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
        }
        const center = (node: Element) => {
            node.scrollIntoView({ block: 'center', inline: 'center' })
            const rect = node.getBoundingClientRect()
            return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) }
        }
        const describe = (node: Element) => {
            const role = node.getAttribute('role') || node.tagName.toLowerCase()
            const name = (node.getAttribute('aria-label') || (node as HTMLElement).innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60)
            return name ? `${role} "${name}"` : role
        }
        /**
         * What is at (x, y) on every level from the node up to the document:
         * a shadow root sees only its own tree, and the page around a shadow
         * host only the host, so an overlay on the page is found one level up.
         * Asked of each (possibly closed) root, hits are not retargeted.
         */
        const coverAt = (node: Element, x: number, y: number): Element | undefined => {
            let target: Element = node
            while (true) {
                const root = target.getRootNode() as Document | ShadowRoot
                const hit = root.elementFromPoint(x, y)
                const label = hit?.closest('label') as HTMLLabelElement | null
                // a label of the element, or one that wraps it, forwards the click
                if (hit && hit !== target && !target.contains(hit) && !hit.contains(target) && label?.control !== target) {
                    return hit
                }
                if (!(root instanceof ShadowRoot)) {
                    return undefined
                }
                target = root.host
            }
        }
        const href = (el as HTMLAnchorElement).href || undefined
        if (!visible(el)) {
            const label = (el as HTMLInputElement).labels?.[0]
            if (label && visible(label)) {
                const point = center(label)
                const cover = coverAt(label, point.x, point.y)
                return cover
                    ? { state: 'covered' as const, ...point, cover: describe(cover) }
                    : { state: 'label' as const, ...point }
            }
            return { state: 'hidden' as const, x: 0, y: 0, href }
        }
        const { x, y } = center(el)
        const cover = coverAt(el, x, y)
        return cover
            ? { state: 'covered' as const, x, y, cover: describe(cover), href }
            : { state: 'ok' as const, x, y }
    }) as Promise<ClickPoint>
}

/**
 * Click the element, or fail at once with what is in the way (see clickPoint).
 */
async function clickChecked (session: Session, target: ResolvedTarget) {
    const point = await clickPoint(target).catch(() => undefined)
    if (point?.state === 'hidden') {
        throw usage(
            `${target.label} is not visible on the page${point.href ? `; it links to ${point.href}` : ''}.`,
            point.href
                ? 'It may be inside a closed menu, tab or dialog: open that first, or navigate to the link.'
                : 'It may be inside a closed menu, tab or dialog: open that first.'
        )
    }
    if (point?.state === 'covered') {
        throw usage(
            `${target.label} is covered by ${point.cover}.`,
            'Close or dismiss what is on top first (a cookie banner, dialog or popup), or scroll so the element is free.'
        )
    }
    if (point?.state === 'label') {
        await pointerClick(session, point)
        return
    }
    try {
        await withPointerFallback(session, target, () => target.element.click())
    } catch (err) {
        /**
         * The driver scrolls the element into view its own way, which can put
         * it under a sticky header or a banner. Where the check above found the
         * element free, a pointer click there reaches it.
         */
        if (!/click intercepted|not interactable/i.test(`${(err as Error).name} ${(err as Error).message}`)) {
            throw err
        }
        const again = await clickPoint(target).catch(() => undefined)
        if (again?.state === 'ok' || again?.state === 'label') {
            await pointerClick(session, again)
            return
        }
        if (again?.state === 'covered') {
            throw usage(
                `${target.label} is covered by ${again.cover}.`,
                'Close or dismiss what is on top first (a cookie banner, dialog or popup), or scroll so the element is free.'
            )
        }
        throw err
    }
}

function pointerClick (session: Session, point: ClickPoint) {
    return session.browser.action('pointer').move({ x: point.x, y: point.y, origin: 'viewport' }).down().up().perform()
}

/**
 * The driver's "is it interactable" check looks at what is at the element's
 * position. For an element inside a closed shadow root that is the shadow
 * host, so the command fails although the element is visible and enabled.
 * In that case: scroll it into view, click its center with a real pointer
 * action (trusted events, like a user) and continue with `after`. Only when
 * the element's own shadow root sees it at that point: anything else there
 * (an overlay, a clipped edge) would get the click instead.
 */
async function withPointerFallback (session: Session, target: ResolvedTarget, run: () => Promise<unknown>, after?: () => Promise<unknown>) {
    try {
        await run()
    } catch (err) {
        if (!/not interactable|did not become interactable/i.test(`${(err as Error).name} ${(err as Error).message}`)) {
            throw err
        }
        const center = await target.element.execute((el) => {
            el.scrollIntoView({ block: 'center', inline: 'center' })
            const rect = el.getBoundingClientRect()
            const x = Math.round(rect.x + rect.width / 2)
            const y = Math.round(rect.y + rect.height / 2)
            // asked of the element's own (possibly closed) root, the hit is not retargeted to a host
            const root = el.getRootNode() as Document | ShadowRoot
            const hit = root.elementFromPoint(x, y)
            return { x, y, hit: Boolean(hit && (hit === el || el.contains(hit))) }
        })
        if (!center.hit) {
            throw err
        }
        await session.browser.action('pointer').move({ x: center.x, y: center.y, origin: 'viewport' }).down().up().perform()
        await after?.()
    }
}

export const type: ActionFn = async (session, args) => {
    let value = String(args.text ?? '')
    // `type e2 Ada` types into e2, the way other agent browsers take an
    // element first; without a leading ref it types into the focused element
    const [first, ...rest] = value.split(' ')
    if (rest.length && refId(first)) {
        const target = await resolveTarget(session, first)
        value = rest.join(' ')
        await target.element.addValue(value)
        return done(`Typed ${value.length} character${value.length === 1 ? '' : 's'} into ${target.label}`, `await ${target.code}.addValue(${quote(value)})`)
    }
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

export const upload: ActionFn = async (session, args) => {
    const file = path.resolve(String(args.$cwd || session.cwd), String(args.file ?? ''))
    if (!args.file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        throw usage(`File ${file} does not exist.`)
    }
    const target = await resolveTarget(session, args.target)
    /**
     * `setFiles` needs WebDriver BiDi. A Classic session sets the path with
     * `setValue`, which works when the browser can read the file.
     */
    if (!session.isBidi) {
        await target.element.setValue(file)
        return done(`Set ${target.label} to ${path.basename(file)}`, `await ${target.code}.setValue(${quote(file)})`)
    }
    await target.element.setFiles(file)
    return done(`Set ${target.label} to ${path.basename(file)}`, `await ${target.code}.setFiles(${quote(file)})`)
}

export const focus: ActionFn = async (session, args) => {
    const target = await resolveTarget(session, args.target)
    await scopeOf(session).execute((el: HTMLElement) => el.focus(), target.element)
    return done(`Focused ${target.label}`, `await browser.execute((el) => el.focus(), ${target.code})`)
}

export const setChecked: ActionFn = async (session, args) => {
    const target = await resolveTarget(session, args.target)
    const want = args.uncheck !== true
    const selected = await target.element.isSelected()
    if (selected !== want) {
        await clickChecked(session, target)
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
        await scopeOf(session).scroll(0, dy)
        return done(`Scrolled ${where} ${px}px`, `await browser.scroll(0, ${dy})`)
    }
    if (where === 'top' || where === 'bottom') {
        const fn = where === 'top'
            ? '() => window.scrollTo(0, 0)'
            : '() => window.scrollTo(0, document.documentElement.scrollHeight)'
        await scopeOf(session).execute(where === 'top'
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
