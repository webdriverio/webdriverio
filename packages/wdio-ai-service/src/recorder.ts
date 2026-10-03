import { getContextManager } from 'webdriverio'

import { contextTree } from './contexts.js'

import {
    DEFAULT_SETTLE_TIMEOUT, isEffectRequest, isIgnored, statusClass, urlTemplate,
    type EffectsConfig, type StepEffect
} from './effects.js'

export { DEFAULT_SETTLE_TIMEOUT }

export const EFFECTS_CHANNEL = 'wdio-ai-effects'

export const DEFAULT_QUIET = 100
const POLL = 25

const EVENTS = [
    'network.beforeRequestSent', 'network.responseCompleted', 'network.fetchError',
    'browsingContext.navigationStarted', 'browsingContext.load', 'browsingContext.domContentLoaded',
    'browsingContext.navigationFailed', 'browsingContext.fragmentNavigated',
    'browsingContext.contextCreated', 'browsingContext.userPromptOpened', 'script.message'
]
/**
 * events not every browser implements yet, e.g. Firefox rejects
 * `browsingContext.navigationAborted`
 */
const OPTIONAL_EVENTS = ['browsingContext.navigationAborted', 'browsingContext.historyUpdated']

/**
 * Watch the DOM and report the named regions that change. Runs in the page:
 * it must not reference anything outside its body. `report` is a BiDi
 * channel, or a function that collects the regions for Classic sessions.
 */
/* c8 ignore start: runs in the browser */
export function observeRegions (report: (regions: string[]) => void) {
    const w = window as unknown as { __wdioAiObserver?: MutationObserver, __wdioAiEpoch?: (epoch: number) => void }
    if (w.__wdioAiObserver) {
        return
    }
    /**
     * a step starts a new epoch, changes reported before it belong to the
     * page load or the previous step
     */
    let epoch = 0
    const LANDMARKS: Record<string, string> = {
        MAIN: 'main', NAV: 'navigation', ASIDE: 'complementary', DIALOG: 'dialog', FORM: 'form',
        SECTION: 'region', TABLE: 'table', UL: 'list', OL: 'list', OUTPUT: 'status', HEADER: 'banner', FOOTER: 'contentinfo'
    }
    const LIVE_ROLES = new Set(['status', 'alert', 'log', 'dialog', 'alertdialog', 'region', 'form', 'navigation', 'main', 'complementary', 'list', 'table', 'grid', 'tabpanel', 'menu', 'listbox', 'tree', 'banner', 'contentinfo'])
    const collapse = (s: string | null | undefined) => (s || '').replace(/\s+/g, ' ').trim()
    const nameOf = (el: Element) => {
        const label = collapse(el.getAttribute('aria-label'))
        if (label) {
            return label
        }
        const labelledBy = el.getAttribute('aria-labelledby')
        if (labelledBy) {
            const text = collapse(labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' '))
            if (text) {
                return text
            }
        }
        const heading = el.querySelector('h1,h2,h3,h4,h5,h6,legend,caption')
        return collapse(heading?.textContent).slice(0, 60)
    }
    const regionOf = (node: Node | null): string => {
        let el: Element | null = node && node.nodeType === 1 ? node as Element : node?.parentElement || null
        while (el && el !== document.documentElement) {
            const role = collapse(el.getAttribute('role')).split(' ')[0] || LANDMARKS[el.tagName] || ''
            if (role && LIVE_ROLES.has(role)) {
                const name = nameOf(el)
                if (name || ['main', 'navigation', 'banner', 'contentinfo', 'status', 'alert', 'dialog'].includes(role)) {
                    return name ? `${role} "${name}"` : role
                }
            }
            el = el.parentElement || ((el.getRootNode() as ShadowRoot).host ?? null)
        }
        return 'page'
    }
    const pending = new Set<string>()
    let scheduled = false
    w.__wdioAiEpoch = (next: number) => {
        epoch = next
        pending.clear()
    }
    const observer = new MutationObserver((records) => {
        for (const record of records) {
            pending.add(regionOf(record.target))
        }
        if (!scheduled) {
            scheduled = true
            setTimeout(() => {
                scheduled = false
                const regions = [...pending]
                pending.clear()
                if (regions.length) {
                    report([String(epoch), ...regions])
                }
            }, 20)
        }
    })
    /**
     * a preload script runs before the document has an `<html>` element,
     * the document node itself is always there
     */
    observer.observe(document, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['class', 'hidden', 'aria-hidden', 'aria-expanded', 'aria-selected', 'aria-checked', 'aria-pressed', 'disabled', 'open']
    })
    w.__wdioAiObserver = observer
}

/**
 * Classic sessions collect the regions in the page and read them back
 */
export function observeRegionsClassic (observe: string) {
    const w = window as unknown as { __wdioAiEffects?: { regions: string[] }, __wdioAiEpoch?: (epoch: number) => void }
    if (!w.__wdioAiEffects) {
        w.__wdioAiEffects = { regions: [] }
        const install = new Function('report', `return (${observe})(report)`)
        install((message: string[]) => {
            w.__wdioAiEffects!.regions.push(...message.slice(1))
        })
    }
    w.__wdioAiEpoch?.(1)
    w.__wdioAiEffects.regions = []
}
/* c8 ignore stop */

interface RequestParams {
    context?: string | null
    navigation?: string | null
    request: { request: string, url: string, method: string, destination?: string, initiatorType?: string | null }
    response?: { status?: number }
}

/**
 * Records the effect of one step at a time: call `start()` before the
 * step and `settle()` after it.
 */
export class EffectRecorder {
    readonly browser: WebdriverIO.Browser
    readonly config: EffectsConfig
    readonly bidi: boolean
    #active = false
    #page?: string
    /**
     * the page of the step and its frames, events of other tabs do not count
     */
    #contexts = new Set<string>()
    #pageUrl?: string
    #inflight = new Map<string, { method: string, url: string }>()
    #requests = new Set<string>()
    #pendingNavigations = new Set<string>()
    #navigation?: string
    #openedContexts = new Set<string>()
    #opened?: string
    #changed = new Set<string>()
    #prompt?: string
    #lastActivity = 0
    #unsettled: string[] = []
    #classicUrl?: string
    #epoch = 0

    constructor (browser: WebdriverIO.Browser, config: EffectsConfig) {
        this.browser = browser
        this.config = config
        this.bidi = Boolean((browser as unknown as { isBidi?: boolean }).isBidi)
    }

    /**
     * subscribe to the BiDi events and install the DOM observer
     */
    static async attach (browser: WebdriverIO.Browser, config: EffectsConfig) {
        const recorder = new EffectRecorder(browser, config)
        if (recorder.bidi) {
            await recorder.#attachBidi()
        }
        return recorder
    }

    async #attachBidi () {
        const browser = this.browser
        await browser.sessionSubscribe({ events: EVENTS })
        for (const event of OPTIONAL_EVENTS) {
            await browser.sessionSubscribe({ events: [event] }).catch(() => {})
        }
        const on = <T>(event: string, handler: (params: T) => void) => (browser.on as unknown as (event: string, handler: (params: T) => void) => void).call(browser, event, handler)
        on('network.beforeRequestSent', (params: RequestParams) => this.#requestStarted(params))
        on('network.responseCompleted', (params: RequestParams) => this.#requestFinished(params, false))
        on('network.fetchError', (params: RequestParams) => this.#requestFinished(params, true))
        on('browsingContext.navigationStarted', (params: { context: string, navigation: string | null, url: string }) => this.#navigationStarted(params))
        for (const event of ['browsingContext.load', 'browsingContext.domContentLoaded', 'browsingContext.navigationFailed', 'browsingContext.navigationAborted']) {
            on(event, (params: { navigation: string | null }) => {
                if (params.navigation) {
                    this.#pendingNavigations.delete(params.navigation)
                }
            })
        }
        for (const event of ['browsingContext.historyUpdated', 'browsingContext.fragmentNavigated']) {
            on(event, (params: { context: string, url: string }) => {
                if (this.#active && params.context === this.#page) {
                    this.#navigation = urlTemplate(params.url, this.#pageUrl)
                    this.#touch()
                }
            })
        }
        on('browsingContext.contextCreated', (params: { context: string, parent?: string | null, originalOpener?: string | null, url: string }) => {
            if (!this.#active) {
                return
            }
            /**
             * a frame the step added to the page
             */
            if (params.parent) {
                if (this.#contexts.has(params.parent)) {
                    this.#contexts.add(params.context)
                }
                return
            }
            /**
             * a window the page opened, not one another tab opened
             */
            if (params.context !== this.#page && (!params.originalOpener || this.#inPage(params.originalOpener))) {
                this.#openedContexts.add(params.context)
                this.#opened ??= urlTemplate(params.url, this.#pageUrl)
                this.#touch()
            }
        })
        on('browsingContext.userPromptOpened', (params: { context: string, type: string }) => {
            if (this.#active && this.#inPage(params.context)) {
                this.#prompt = params.type
                this.#touch()
            }
        })
        on('script.message', (params: { channel: string, source?: { context?: string }, data: { type?: string, value?: { type?: string, value?: string }[] } }) => {
            if (!this.#active || params.channel !== EFFECTS_CHANNEL || params.data?.type !== 'array' || !this.#inPage(params.source?.context)) {
                return
            }
            const [epoch, ...regions] = (params.data.value || []).map((item) => item.value)
            if (Number(epoch) !== this.#epoch) {
                return
            }
            for (const region of regions) {
                if (typeof region === 'string') {
                    this.#changed.add(region)
                }
            }
            this.#touch()
        })

        const functionDeclaration = observeRegions.toString()
        const channel = { type: 'channel', value: { channel: EFFECTS_CHANNEL } }
        await browser.scriptAddPreloadScript({ functionDeclaration, arguments: [channel] } as never)
        const contexts = await browser.browsingContextGetTree({}).catch(() => ({ contexts: [] }))
        for (const context of contexts.contexts) {
            await browser.scriptCallFunction({
                functionDeclaration,
                arguments: [channel],
                target: { context: context.context },
                awaitPromise: false
            } as never).catch(() => {})
        }
    }

    #touch () {
        this.#lastActivity = Date.now()
    }

    /**
     * whether an event belongs to the page of the step or one of its frames
     */
    #inPage (context?: string | null) {
        return !context || !this.#contexts.size || this.#contexts.has(context)
    }

    #requestStarted (params: RequestParams) {
        if (!this.#active) {
            return
        }
        if (!this.#inPage(params.context)) {
            return
        }
        const { request, url, method, destination, initiatorType } = params.request
        if (!isEffectRequest({ url, destination, initiatorType, navigation: params.navigation }) || isIgnored(url, this.config.ignore)) {
            return
        }
        this.#inflight.set(request, { method, url })
        this.#touch()
    }

    #requestFinished (params: RequestParams, failed: boolean) {
        const started = this.#inflight.get(params.request.request)
        if (!started) {
            return
        }
        this.#inflight.delete(params.request.request)
        this.#requests.add(`${started.method} ${urlTemplate(started.url, this.#pageUrl)} → ${statusClass(params.response?.status, failed)}`)
        this.#touch()
    }

    #navigationStarted (params: { context: string, navigation: string | null, url: string }) {
        if (!this.#active) {
            return
        }
        if (params.context === this.#page) {
            this.#navigation = urlTemplate(params.url, this.#pageUrl)
            if (params.navigation) {
                this.#pendingNavigations.add(params.navigation)
            }
            this.#touch()
        } else if (this.#openedContexts.has(params.context) && params.url !== 'about:blank') {
            this.#opened = urlTemplate(params.url, this.#pageUrl)
            this.#touch()
        }
    }

    /**
     * start a step: forget the previous effect
     */
    async start () {
        this.#inflight.clear()
        this.#requests.clear()
        this.#pendingNavigations.clear()
        this.#openedContexts.clear()
        this.#changed.clear()
        this.#navigation = undefined
        this.#opened = undefined
        this.#prompt = undefined
        this.#pageUrl = await this.browser.getUrl().catch(() => undefined)
        if (this.bidi) {
            this.#page = await getContextManager(this.browser).getCurrentContext().catch(() => undefined)
            this.#contexts = await contextTree(this.browser, this.#page)
            await this.#nextEpoch()
        } else {
            this.#classicUrl = this.#pageUrl
            await this.browser.execute(observeRegionsClassic, observeRegions.toString()).catch(() => {})
        }
        this.#lastActivity = Date.now()
        this.#active = true
    }

    /**
     * start a new epoch in the page and its frames
     */
    async #nextEpoch () {
        const epoch = ++this.#epoch
        await Promise.all([...this.#contexts].map((context) => this.browser.scriptCallFunction({
            functionDeclaration: '(epoch) => { window.__wdioAiEpoch && window.__wdioAiEpoch(epoch) }',
            arguments: [{ type: 'number', value: epoch }],
            target: { context },
            awaitPromise: false
        } as never).catch(() => {})))
    }

    /**
     * Wait until the step settled: its requests finished, no navigation is
     * pending and the page had no changes for `quiet` ms. Returns the effect.
     */
    async settle ({ timeout = DEFAULT_SETTLE_TIMEOUT, quiet = DEFAULT_QUIET }: { timeout?: number, quiet?: number } = {}): Promise<StepEffect> {
        const deadline = Date.now() + timeout
        try {
            if (!this.bidi) {
                return await this.#settleClassic(deadline, quiet)
            }
            this.#unsettled = []
            await this.#flush()
            /**
             * the quiet time counts from when the action returned: a slow
             * click must not use it up before the page reported its changes
             */
            this.#touch()
            while (Date.now() < deadline) {
                const idle = this.#inflight.size === 0 && this.#pendingNavigations.size === 0
                if (idle && Date.now() - this.#lastActivity >= quiet) {
                    break
                }
                await new Promise((resolve) => setTimeout(resolve, POLL))
            }
            /**
             * A page that keeps changing is done once its requests and
             * navigations are. A request still in flight means the effect
             * is incomplete, not that the step had no such effect.
             */
            this.#unsettled = [
                ...[...this.#inflight.values()].map(({ method, url }) => `${method} ${urlTemplate(url, this.#pageUrl)}`),
                ...(this.#pendingNavigations.size ? ['a navigation'] : [])
            ]
            return this.#effect()
        } finally {
            this.#active = false
        }
    }

    /**
     * One round trip to the page after the action: the page renders a frame
     * (at most 100 ms), so requests the action started and the changes it
     * made are reported before the quiet time starts. On a slow machine their
     * events otherwise arrived after a short quiet time had already passed.
     */
    async #flush () {
        if (!this.#page) {
            return
        }
        try {
            await this.browser.scriptEvaluate({
                expression: 'new Promise((resolve) => { requestAnimationFrame(() => setTimeout(resolve, 0)); setTimeout(resolve, 100) })',
                awaitPromise: true,
                target: { context: this.#page }
            })
        } catch {
            // the page navigated away or is gone, its events are already in
        }
    }

    /**
     * what was still running when the last `settle()` timed out, empty when
     * the step finished
     */
    get unsettled (): string[] {
        return [...this.#unsettled]
    }

    async #settleClassic (deadline: number, quiet: number): Promise<StepEffect> {
        this.#unsettled = []
        let last = Date.now()
        let seen = 0
        while (Date.now() < deadline) {
            const regions = await this.browser.execute(() => {
                const w = window as unknown as { __wdioAiEffects?: { regions: string[] } }
                return w.__wdioAiEffects ? w.__wdioAiEffects.regions : []
            }).catch(() => [] as string[])
            if (regions.length > seen) {
                seen = regions.length
                regions.forEach((region) => this.#changed.add(region))
                last = Date.now()
            }
            if (Date.now() - last >= quiet) {
                break
            }
            await new Promise((resolve) => setTimeout(resolve, POLL))
        }
        const url = await this.browser.getUrl().catch(() => undefined)
        if (url && this.#classicUrl && url !== this.#classicUrl) {
            this.#navigation = urlTemplate(url, this.#classicUrl)
        }
        return this.#effect()
    }

    #effect (): StepEffect {
        return {
            ...(this.#requests.size ? { requests: [...this.#requests].sort() } : {}),
            ...(this.#navigation ? { navigation: this.#navigation } : {}),
            ...(this.#opened ? { opened: this.#opened } : {}),
            ...(this.#changed.size ? { changed: [...this.#changed].sort() } : {}),
            ...(this.#prompt ? { prompt: this.#prompt } : {})
        }
    }
}
