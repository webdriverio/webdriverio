import fs from 'node:fs'
import path from 'node:path'

import { UNICODE_CHARACTERS, getWdioKind } from '@wdio/utils'
import { getContextManager } from 'webdriverio'

import { usage } from '../errors.js'
import { quote } from '../quote.js'
import { resolveTarget, scopeOf, type ResolvedTarget } from '../snapshot/target.js'
import { refId } from '../snapshot/refs.js'
import { describeViewport } from './observe.js'
import type { ActionFn, ActionOutcome, Session } from '../session.js'
import type { ActionArgs } from './index.js'

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

/** `click 320,480`: viewport coordinates, as read off a screenshot */
const POINT = /^\s*(\d{1,5})\s*,\s*(\d{1,5})\s*$/

/**
 * Click at a point of the viewport, for what has no ref: a canvas, a map, a
 * custom widget the snapshot doesn't see. Says what was there.
 */
async function clickAt (session: Session, x: number, y: number, args: ActionArgs) {
    if (args.double || args.right || args.newTab) {
        throw usage('Coordinates take a plain click.', 'Click a ref or selector for --double, --right or --new-tab.')
    }
    // they are viewport pixels of the page, as in a screenshot, not of a frame inside it
    if (session.get?.('frame')) {
        throw usage('Coordinates are viewport pixels of the page, and the session is inside a frame.', 'Run `wdio session frame top` first, or click a ref from the frame.')
    }
    const what = await scopeOf(session).execute(function (px: number, py: number) {
        const el = document.elementFromPoint(px, py)
        if (!el) {
            return undefined
        }
        // native accessors: bot checks plant elements that shadow them (see `isDecoy` in web.ts)
        const tag = Object.getOwnPropertyDescriptor(Element.prototype, 'tagName')!.get!.call(el) as string
        const attr = (name: string) => Element.prototype.getAttribute.call(el, name)
        const text = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerText')?.get?.call(el) as string | undefined
        const role = attr('role') || tag.toLowerCase()
        const name = (attr('aria-label') || text || '').trim().replace(/\s+/g, ' ').slice(0, 60)
        return name ? `${role} "${name}"` : role
    }, x, y) as string | undefined
    if (!what) {
        throw usage(`Nothing is at ${x},${y}.`, 'Coordinates are viewport pixels from the top left, as in a screenshot; take one to check.')
    }
    const text = await withNavigation(session, `Clicked ${what} at ${x},${y}`, () => pointerClick(session, { state: 'ok', x, y }))
    return done(text, `await browser.action('pointer').move({ x: ${x}, y: ${y}, origin: 'viewport' }).down().up().perform()`)
}

export const click: ActionFn = async (session, args) => {
    const point = typeof args.target === 'string' ? POINT.exec(args.target) : null
    if (point) {
        return clickAt(session, Number(point[1]), Number(point[2]), args)
    }
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

/** how each input type `setValue` sets directly writes its value, for the error when one isn't taken */
const FORMATS: Record<string, string> = {
    date: '2026-10-04',
    time: '14:30',
    'datetime-local': '2026-10-04T14:30',
    month: '2026-10',
    week: '2026-W40',
    color: '#ff8800'
}

/** most arrow key presses `fill` spends on an ARIA slider */
const MAX_SLIDER_STEPS = 200

interface FillKind { kind: 'direct' | 'slider' | 'text', type?: string, now?: number, min?: number, max?: number }

async function fillKind (target: ResolvedTarget): Promise<FillKind> {
    if (typeof target.element.execute !== 'function') {
        return { kind: 'text' }
    }
    const kind = await target.element.execute((el: Element) => {
        const type = (el as HTMLInputElement).type
        if (el.tagName === 'INPUT' && ['range', 'date', 'time', 'datetime-local', 'month', 'week', 'color'].includes(type)) {
            return { kind: 'direct' as const, type }
        }
        if (el.getAttribute('role') === 'slider' && !['INPUT', 'TEXTAREA'].includes(el.tagName)) {
            const num = (name: string) => el.hasAttribute(name) ? Number(el.getAttribute(name)) : undefined
            return { kind: 'slider' as const, now: num('aria-valuenow'), min: num('aria-valuemin'), max: num('aria-valuemax') }
        }
        return { kind: 'text' as const }
    }).catch(() => undefined) as FillKind | undefined
    return kind && typeof kind === 'object' && 'kind' in kind ? kind : { kind: 'text' }
}

/**
 * An ARIA slider (role="slider", no input behind it) takes its value from
 * the keyboard: focus it and press arrow keys until aria-valuenow reaches
 * the value, at most MAX_SLIDER_STEPS times. Returns where it stopped and
 * the keys it pressed.
 */
async function slideTo (session: Session, target: ResolvedTarget, want: number): Promise<{ reached?: number, pressed: string[] }> {
    const now = async () => {
        const raw = await target.element.getAttribute('aria-valuenow')
        return raw === null ? undefined : Number(raw)
    }
    await scopeOf(session).execute((el: HTMLElement) => el.focus(), target.element)
    let current = await now()
    const pressed: string[] = []
    for (let step = 0; step < MAX_SLIDER_STEPS && current !== undefined && current !== want; step++) {
        const key = current < want ? 'ArrowRight' : 'ArrowLeft'
        await session.browser.keys(key)
        pressed.push(key)
        const next = await now()
        const stuck = next === undefined || next === current
        const overshot = next !== undefined && next !== want && (current < want) !== (next < want)
        current = next
        // a value that doesn't move, or jumps past the target, is as close as the keyboard gets
        if (stuck || overshot) {
            break
        }
    }
    return { reached: current, pressed }
}

/** focus a range input and step it away and back, toward the side it can move to */
async function nudge (session: Session, target: ResolvedTarget) {
    const atMax = await scopeOf(session).execute((el: HTMLInputElement) => {
        el.focus()
        // a range input without a max goes up to 100
        return Number(el.value) >= (el.max === '' ? 100 : Number(el.max))
    }, target.element as unknown as HTMLInputElement).catch(() => false)
    const keys = atMax ? ['ArrowLeft', 'ArrowRight'] : ['ArrowRight', 'ArrowLeft']
    for (const key of keys) {
        await session.browser.keys(key)
    }
    return keys
}

/** replayable code for the keys `slideTo` pressed: one loop per run of the same key */
function pressCode (keys: string[]) {
    const runs: [string, number][] = []
    for (const key of keys) {
        const last = runs[runs.length - 1]
        if (last?.[0] === key) {
            last[1]++
        } else {
            runs.push([key, 1])
        }
    }
    return runs.map(([key, count]) => count === 1
        ? `await browser.keys(${quote(key)})`
        : `for (let i = 0; i < ${count}; i++) {\n    await browser.keys(${quote(key)})\n}`)
}

export const fill: ActionFn = async (session, args) => {
    const target = await resolveTarget(session, args.target)
    const value = String(args.text ?? '')
    const kind = await fillKind(target)
    if (kind.kind === 'direct') {
        // setValue sets these directly, as their picker does (see webdriverio's setValue)
        await target.element.setValue(value)
        const took = await target.element.getValue()
        if (took !== value && kind.type !== 'range') {
            throw usage(`${target.label} did not take ${JSON.stringify(value)}; it has ${JSON.stringify(took)}.`, `A ${kind.type} input takes values like ${FORMATS[kind.type!] ?? 'its own format'}.`)
        }
        const note = took !== value ? ` (it took ${took}: the nearest allowed value)` : ''
        if (kind.type === 'range') {
            /**
             * A slider widget can keep its own state and miss a value set
             * from code. One step away and back with the keyboard ends on the
             * same value, with the key and input events a user's drag makes.
             */
            const keys = await nudge(session, target)
            // a step the slider couldn't take back (a min or max it didn't report) leaves it elsewhere
            const now = await target.element.getValue()
            if (now !== took) {
                await target.element.setValue(took)
            }
            return done(`Set ${target.label} to ${took}${note}`, [
                `await ${target.code}.setValue(${quote(value)})`,
                `await browser.execute((el) => el.focus(), await ${target.code})`,
                ...keys.map((key) => `await browser.keys(${quote(key)})`)
            ].join('\n'))
        }
        return done(`Set ${target.label} to ${took}${note}`, `await ${target.code}.setValue(${quote(value)})`)
    }
    if (kind.kind === 'slider') {
        const want = Number(value)
        if (!Number.isFinite(want)) {
            throw usage(`${target.label} is a slider and takes a number.`, kind.min !== undefined && kind.max !== undefined ? `Pass a number from ${kind.min} to ${kind.max}.` : 'Pass a number.')
        }
        const { reached, pressed } = await slideTo(session, target, want)
        if (reached !== want) {
            throw usage(`${target.label} stopped at ${reached ?? 'an unknown value'}, not ${want}.`, kind.min !== undefined && kind.max !== undefined ? `Its range is ${kind.min} to ${kind.max}.` : 'Use `press` with arrow keys to adjust it.')
        }
        return done(`Set ${target.label} to ${reached}`, [`await browser.execute((el) => el.focus(), await ${target.code})`, ...pressCode(pressed)].join('\n'))
    }
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
        // native accessors: bot checks plant elements that shadow them (see `isDecoy` in web.ts)
        const describe = (node: Element) => {
            const tag = Object.getOwnPropertyDescriptor(Element.prototype, 'tagName')!.get!.call(node) as string
            const attr = (name: string) => Element.prototype.getAttribute.call(node, name)
            const text = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerText')?.get?.call(node) as string | undefined
            const role = attr('role') || tag.toLowerCase()
            const name = (attr('aria-label') || text || '').trim().replace(/\s+/g, ' ').slice(0, 60)
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
                const label = hit ? Element.prototype.closest.call(hit, 'label') as HTMLLabelElement | null : null
                // a label of the element, or one that wraps it, forwards the click
                if (hit && hit !== target && !target.contains(hit) && !Node.prototype.contains.call(hit, target) && label?.control !== target) {
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

/** most times `press --times` repeats a key */
const MAX_PRESS_TIMES = 100

/** how long `press` waits for a key that was on its way when the action ended */
const KEY_SETTLE_MS = 5_000

export const press: ActionFn = async (session, args) => {
    const keys = parseKeys(String(args.keys ?? ''))
    const times = args.times === undefined ? 1 : Number(args.times)
    if (!Number.isInteger(times) || times < 1 || times > MAX_PRESS_TIMES) {
        throw usage(`--times must be a whole number from 1 to ${MAX_PRESS_TIMES}.`)
    }
    const once = keys.length === 1
        ? `await browser.keys(${quote(keys[0])})`
        : `await browser.keys([${keys.map(quote).join(', ')}])`
    const code = times === 1 ? once : `for (let i = 0; i < ${times}; i++) {\n    ${once}\n}`
    const label = `Pressed ${keys.join('+')}${times === 1 ? '' : ` ${times} times`}`
    // once the action reports back (also when a page is still loading) no key may follow
    let stopped = false
    let pressing: Promise<void> = Promise.resolve()
    const text = await withNavigation(session, label, () => {
        pressing = (async () => {
            for (let i = 0; i < times && !stopped; i++) {
                await session.browser.keys(keys.length === 1 ? keys[0] : keys)
            }
        })()
        return pressing
    }).finally(() => {
        stopped = true
    })
    /**
     * A key that was already on its way finishes before the next command, for
     * a few seconds at most: a driver that never answers must not hold the
     * session. A key that fails meanwhile is reported, not hidden.
     */
    let timer: NodeJS.Timeout | undefined
    const late = await Promise.race([
        pressing.then(() => undefined, (err: Error) => err),
        new Promise<'pending'>((resolve) => { timer = setTimeout(() => resolve('pending'), KEY_SETTLE_MS) })
    ]).finally(() => clearTimeout(timer))
    if (late instanceof Error) {
        throw late
    }
    return done(late === 'pending' ? `${text}\nA key press was still pending when the action ended.` : text, code)
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
        const text = await optionText(session, target, value)
        await target.element.selectByVisibleText(text)
        call = `selectByVisibleText(${quote(text)})`
        return done(`Selected ${JSON.stringify(text)} in ${target.label}`, `await ${target.code}.${call}`)
    }
    return done(`Selected ${JSON.stringify(value)} in ${target.label}`, `await ${target.code}.${call}`)
}

/**
 * The text of the option `wanted` means in a native select: as given, or
 * apart from case and spacing ("used" for "Used"). Without a match the
 * options are listed at once, instead of waiting for one that never comes.
 */
/** how long `select` waits for options a page adds after the select (hydration) */
const OPTION_WAIT_MS = 5000

async function optionText (session: Session, target: ResolvedTarget, wanted: string) {
    const deadline = Date.now() + OPTION_WAIT_MS
    let found = await lookUpOption(session, target, wanted)
    while (found && found.match === undefined && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 250))
        found = await lookUpOption(session, target, wanted)
    }
    if (!found) {
        return wanted
    }
    if (found.match === undefined) {
        const list = found.options.slice(0, 30).map((o) => JSON.stringify(o)).join(', ')
        throw usage(`${target.label} has no option ${JSON.stringify(wanted)}.`, `Its options: ${list}${found.options.length > 30 ? ', …' : ''}.`)
    }
    return found.match
}

async function lookUpOption (session: Session, target: ResolvedTarget, wanted: string) {
    return await scopeOf(session).execute((el: HTMLSelectElement, value: string) => {
        if (el.tagName !== 'SELECT') {
            return undefined
        }
        const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()
        const options = Array.from(el.options).map((o) => normalize(o.text))
        const exact = options.find((o) => o === normalize(value))
        const loose = options.find((o) => o.toLowerCase() === normalize(value).toLowerCase()) ??
            Array.from(el.options).find((o) => o.value.toLowerCase() === value.trim().toLowerCase())?.text
        return { match: exact ?? (loose === undefined ? undefined : normalize(loose)), options }
    }, target.element as unknown as HTMLSelectElement, wanted).catch(() => undefined) as { match?: string, options: string[] } | undefined
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
    return done(`Focused ${target.label}`, `await browser.execute((el) => el.focus(), await ${target.code})`)
}

export const setChecked: ActionFn = async (session, args) => {
    const target = await resolveTarget(session, args.target)
    const want = args.uncheck !== true
    const selected = await target.element.isSelected()
    let viaLabel = false
    if (selected !== want) {
        try {
            await clickChecked(session, target)
        } catch (err) {
            /**
             * Styled checkboxes and swatches hide the input behind (or inside)
             * their label: the input reports covered or not interactable,
             * while a click on the label is what toggles it for a user.
             */
            viaLabel = await scopeOf(session).execute((el: HTMLInputElement) => {
                const label = el.labels?.[0] || el.closest('label')
                if (!label || !['checkbox', 'radio'].includes(el.type)) {
                    return false
                }
                // only a label a user can click: not one a popup lies over
                label.scrollIntoView({ block: 'center', inline: 'nearest' })
                const rect = label.getBoundingClientRect()
                if (!rect.width || !rect.height) {
                    return false
                }
                const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
                if (!hit || !(hit === label || label.contains(hit) || hit === el)) {
                    return false
                }
                label.click()
                return true
            }, target.element as unknown as HTMLInputElement).catch(() => false) as boolean
            if (!viaLabel) {
                throw err
            }
        }
    }
    const after = await target.element.isSelected()
    if (after !== want) {
        throw usage(
            `${target.label} is still ${after ? 'checked' : 'unchecked'}.`,
            want ? 'The control did not become checked.' : 'A selected radio button stays selected when it is clicked.'
        )
    }
    const verb = want ? 'Checked' : 'Unchecked'
    const toggle = viaLabel
        ? `await browser.execute((el) => (el.labels[0] || el.closest('label')).click(), await ${target.code})`
        : `await ${target.code}.click()`
    const guard = `if ((await ${target.code}.isSelected()) !== ${want}) {\n    ${toggle}\n}`
    return done(`${verb} ${target.label}${viaLabel ? ' (with its label: the box itself is covered)' : ''}`, guard)
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
        return done(await withViewport(session, `Scrolled ${where} ${px}px`), `await browser.scroll(0, ${dy})`)
    }
    if (where === 'top' || where === 'bottom') {
        const fn = where === 'top'
            ? '() => window.scrollTo(0, 0)'
            : '() => window.scrollTo(0, document.documentElement.scrollHeight)'
        await scopeOf(session).execute(where === 'top'
            ? () => window.scrollTo(0, 0)
            : () => window.scrollTo(0, document.documentElement.scrollHeight))
        return done(await withViewport(session, `Scrolled to the ${where}`), `await browser.execute(${fn})`)
    }
    const target = await resolveTarget(session, where)
    await target.element.scrollIntoView()
    return done(await withViewport(session, `Scrolled ${target.label} into view`), `await ${target.code}.scrollIntoView()`)
}

/** after a scroll: what is now in view (see describeViewport), so no screenshot is needed to see it */
async function withViewport (session: Session, text: string) {
    const view = await describeViewport(session).catch(() => '')
    return view ? `${text}\nIn view:\n${view}` : text
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
