import { getContextManager } from 'webdriverio'

import { contextTree } from './contexts.js'

import {
    DEFAULT_SETTLE_TIMEOUT, isEffectRequest, isIgnored, statusClass, urlTemplate,
    type EffectsConfig, type StepEffect
} from './effects.js'

export { DEFAULT_SETTLE_TIMEOUT }

export const EFFECTS_CHANNEL = 'wdio-ai-effects'

export const DEFAULT_QUIET = 100
/**
 * longest wait for the page to render a frame after an action
 */
const FLUSH_TIMEOUT = 200
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

export type EffectStepToken = symbol

interface StepState {
    token: EffectStepToken
    page?: string
    contexts: Set<string>
    pageUrl?: string
    inflight: Map<string, { method: string, url: string }>
    requests: Set<string>
    pendingNavigations: Set<string>
    navigation?: string
    openedContexts: Set<string>
    opened?: string
    changed: Set<string>
    prompt?: string
    lastActivity: number
    unsettled: string[]
    classicUrl?: string
    epoch: number
    superseded: boolean
}

function createStepState (token: EffectStepToken): StepState {
    return {
        token,
        contexts: new Set<string>(),
        inflight: new Map<string, { method: string, url: string }>(),
        requests: new Set<string>(),
        pendingNavigations: new Set<string>(),
        openedContexts: new Set<string>(),
        changed: new Set<string>(),
        lastActivity: Date.now(),
        unsettled: [],
        epoch: 0,
        superseded: false
    }
}

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
    #current?: StepState
    #steps = new Map<EffectStepToken, StepState>()
    #unsettled: string[] = []
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
            on(event, (params: { navigation: string | null }) => this.#navigationFinished(params.navigation))
        }
        for (const event of ['browsingContext.historyUpdated', 'browsingContext.fragmentNavigated']) {
            on(event, (params: { context: string, url: string }) => {
                const step = this.#current
                if (step && params.context === step.page) {
                    step.navigation = urlTemplate(params.url, step.pageUrl)
                    this.#touch(step)
                }
            })
        }
        on('browsingContext.contextCreated', (params: { context: string, parent?: string | null, originalOpener?: string | null, url: string }) => {
            const step = this.#current
            if (!step) {
                return
            }
            /**
             * a frame the step added to the page
             */
            if (params.parent) {
                if (step.contexts.has(params.parent)) {
                    step.contexts.add(params.context)
                }
                return
            }
            /**
             * a window the page opened, not one another tab opened
             */
            if (params.context !== step.page && (!params.originalOpener || this.#inPage(step, params.originalOpener))) {
                step.openedContexts.add(params.context)
                step.opened ??= urlTemplate(params.url, step.pageUrl)
                this.#touch(step)
            }
        })
        on('browsingContext.userPromptOpened', (params: { context: string, type: string }) => {
            const step = this.#current
            if (step && this.#inPage(step, params.context)) {
                step.prompt = params.type
                this.#touch(step)
            }
        })
        on('script.message', (params: { channel: string, source?: { context?: string }, data: { type?: string, value?: { type?: string, value?: string }[] } }) => {
            const step = this.#current
            if (!step || params.channel !== EFFECTS_CHANNEL || params.data?.type !== 'array' || !this.#inPage(step, params.source?.context)) {
                return
            }
            const [epoch, ...regions] = (params.data.value || []).map((item) => item.value)
            if (Number(epoch) !== step.epoch) {
                return
            }
            for (const region of regions) {
                if (typeof region === 'string') {
                    step.changed.add(region)
                }
            }
            this.#touch(step)
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

    #touch (step: StepState) {
        step.lastActivity = Date.now()
    }

    /**
     * whether an event belongs to the page of the step or one of its frames
     */
    #inPage (step: StepState, context?: string | null) {
        return !context || !step.contexts.size || step.contexts.has(context)
    }

    #requestStarted (params: RequestParams) {
        const step = this.#current
        if (!step) {
            return
        }
        if (!this.#inPage(step, params.context)) {
            return
        }
        const { request, url, method, destination, initiatorType } = params.request
        if (!isEffectRequest({ url, destination, initiatorType, navigation: params.navigation }) || isIgnored(url, this.config.ignore)) {
            return
        }
        step.inflight.set(request, { method, url })
        this.#touch(step)
    }

    #requestFinished (params: RequestParams, failed: boolean) {
        const step = this.#stepWithRequest(params.request.request)
        const started = step?.inflight.get(params.request.request)
        if (!step || !started) {
            return
        }
        step.inflight.delete(params.request.request)
        step.requests.add(`${started.method} ${urlTemplate(started.url, step.pageUrl)} → ${statusClass(params.response?.status, failed)}`)
        this.#touch(step)
    }

    #navigationStarted (params: { context: string, navigation: string | null, url: string }) {
        const step = this.#current
        if (step && params.context === step.page) {
            step.navigation = urlTemplate(params.url, step.pageUrl)
            if (params.navigation) {
                step.pendingNavigations.add(params.navigation)
            }
            this.#touch(step)
            return
        }
        const openedStep = this.#stepWithOpenedContext(params.context)
        if (openedStep && params.url !== 'about:blank') {
            openedStep.opened = urlTemplate(params.url, openedStep.pageUrl)
            this.#touch(openedStep)
        }
    }

    #stepWithRequest (request: string): StepState | undefined {
        return [...this.#steps.values()].find((step) => step.inflight.has(request))
    }

    #stepWithOpenedContext (context: string): StepState | undefined {
        return [...this.#steps.values()].find((step) => step.openedContexts.has(context))
    }

    #navigationFinished (navigation: string | null) {
        if (!navigation) {
            return
        }
        for (const step of this.#steps.values()) {
            step.pendingNavigations.delete(navigation)
        }
    }

    /**
     * start a step: collect its effect separately from any stale older step
     */
    async start (): Promise<EffectStepToken> {
        if (this.#current) {
            this.#current.superseded = true
        }
        const token = Symbol('wdio-ai-effect-step')
        const step = createStepState(token)
        this.#current = step
        this.#steps.set(token, step)
        step.pageUrl = await this.browser.getUrl().catch(() => undefined)
        if (this.#current !== step) {
            return token
        }
        if (this.bidi) {
            step.page = await getContextManager(this.browser).getCurrentContext().catch(() => undefined)
            if (this.#current !== step) {
                return token
            }
            step.contexts = await contextTree(this.browser, step.page)
            if (this.#current !== step) {
                return token
            }
            await this.#nextEpoch(step)
        } else {
            step.classicUrl = step.pageUrl
            await this.browser.execute(observeRegionsClassic, observeRegions.toString()).catch(() => {})
        }
        this.#touch(step)
        step.superseded = false
        return token
    }

    /**
     * start a new epoch in the page and its frames
     */
    async #nextEpoch (step: StepState) {
        step.epoch = ++this.#epoch
        await Promise.all([...step.contexts].map((context) => this.browser.scriptCallFunction({
            functionDeclaration: '(epoch) => { window.__wdioAiEpoch && window.__wdioAiEpoch(epoch) }',
            arguments: [{ type: 'number', value: step.epoch }],
            target: { context },
            awaitPromise: false
        } as never).catch(() => {})))
    }

    /**
     * Wait until the step settled: its requests finished, no navigation is
     * pending and the page had no changes for `quiet` ms. Returns the effect.
     */
    async settle ({ timeout = DEFAULT_SETTLE_TIMEOUT, quiet = DEFAULT_QUIET }: { timeout?: number, quiet?: number } = {}, token?: EffectStepToken): Promise<StepEffect> {
        const step = token ? this.#steps.get(token) : this.#current
        if (!step) {
            this.#unsettled = []
            return {}
        }
        const deadline = Date.now() + timeout
        try {
            step.unsettled = []
            if (step.superseded && this.#current !== step) {
                step.unsettled = ['another step started before this one settled']
                return this.#effect(step)
            }
            if (!this.bidi) {
                return await this.#settleClassic(step, deadline, quiet)
            }
            if (this.#current === step) {
                await this.#flush(step)
            }
            /**
             * the quiet time counts from when the action returned: a slow
             * click must not use it up before the page reported its changes
             */
            this.#touch(step)
            while (Date.now() < deadline) {
                const idle = step.inflight.size === 0 && step.pendingNavigations.size === 0
                if ((step.superseded && this.#current !== step) || (idle && Date.now() - step.lastActivity >= quiet)) {
                    break
                }
                await new Promise((resolve) => setTimeout(resolve, POLL))
            }
            /**
             * A page that keeps changing is done once its requests and
             * navigations are. A request still in flight means the effect
             * is incomplete, not that the step had no such effect.
             */
            step.unsettled = [
                ...[...step.inflight.values()].map(({ method, url }) => `${method} ${urlTemplate(url, step.pageUrl)}`),
                ...(step.pendingNavigations.size ? ['a navigation'] : []),
                ...(step.superseded && this.#current !== step ? ['another step started before this one settled'] : [])
            ]
            return this.#effect(step)
        } finally {
            this.#unsettled = [...step.unsettled]
            this.#steps.delete(step.token)
            if (this.#current === step) {
                this.#current = undefined
            }
        }
    }

    /**
     * One round trip to the page after the action: the page renders a frame
     * (at most 100 ms), so requests the action started and the changes it
     * made are reported before the quiet time starts. On a slow machine their
     * events otherwise arrived after a short quiet time had already passed.
     */
    async #flush (step: StepState) {
        /**
         * a dialog the step opened blocks scripts in the page until it is
         * handled, the step settles without the round trip
         */
        if (!step.page || step.prompt) {
            return
        }
        const roundTrip = this.browser.scriptEvaluate({
            expression: 'new Promise((resolve) => { requestAnimationFrame(() => setTimeout(resolve, 0)); setTimeout(resolve, 100) })',
            awaitPromise: true,
            target: { context: step.page }
        }).catch(() => {
            // the page navigated away or is gone, its events are already in
        })
        /**
         * never wait for the page longer than this: a dialog that opens
         * during the round trip would hold the script until it is handled
         */
        let timer: ReturnType<typeof setTimeout> | undefined
        await Promise.race([roundTrip, new Promise((resolve) => { timer = setTimeout(resolve, FLUSH_TIMEOUT) })])
        clearTimeout(timer)
    }

    /**
     * what was still running when the last `settle()` timed out, empty when
     * the step finished
     */
    get unsettled (): string[] {
        return [...this.#unsettled]
    }

    async #settleClassic (step: StepState, deadline: number, quiet: number): Promise<StepEffect> {
        step.unsettled = []
        let last = Date.now()
        let seen = 0
        while (Date.now() < deadline) {
            const regions = await this.browser.execute(() => {
                const w = window as unknown as { __wdioAiEffects?: { regions: string[] } }
                return w.__wdioAiEffects ? w.__wdioAiEffects.regions : []
            }).catch(() => [] as string[])
            if (regions.length > seen) {
                seen = regions.length
                regions.forEach((region) => step.changed.add(region))
                last = Date.now()
            }
            if (Date.now() - last >= quiet) {
                break
            }
            await new Promise((resolve) => setTimeout(resolve, POLL))
        }
        const url = await this.browser.getUrl().catch(() => undefined)
        if (url && step.classicUrl && url !== step.classicUrl) {
            step.navigation = urlTemplate(url, step.classicUrl)
        }
        return this.#effect(step)
    }

    #effect (step: StepState): StepEffect {
        return {
            ...(step.requests.size ? { requests: [...step.requests].sort() } : {}),
            ...(step.navigation ? { navigation: step.navigation } : {}),
            ...(step.opened ? { opened: step.opened } : {}),
            ...(step.changed.size ? { changed: [...step.changed].sort() } : {}),
            ...(step.prompt ? { prompt: step.prompt } : {})
        }
    }
}
