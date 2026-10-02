/**
 * What a step observably did: the requests it sent, the navigation it
 * caused, a window it opened, the parts of the page that changed and a
 * dialog it opened. Recorded with every cached step and checked on every
 * replay and heal.
 */
export interface StepEffect {
    /**
     * `METHOD /path/:id → 2xx`, sorted
     */
    requests?: string[]
    /**
     * path template the page navigated to
     */
    navigation?: string
    /**
     * path template of a window or tab the step opened
     */
    opened?: string
    /**
     * named regions of the page that changed, e.g. `status "Cart"`
     */
    changed?: string[]
    /**
     * `alert`, `confirm`, `prompt` or `beforeunload`
     */
    prompt?: string
}

export type EffectsMode = 'strict' | 'loose' | 'off'

export interface EffectsConfig {
    mode: EffectsMode
    /**
     * requests that never count, a string matches a part of the URL
     */
    ignore: (string | RegExp)[]
}

/**
 * analytics and telemetry hosts, their requests are never part of an effect
 */
export const DEFAULT_IGNORE: (string | RegExp)[] = [
    'google-analytics.com', 'googletagmanager.com', 'doubleclick.net', 'analytics.google.com',
    'segment.io', 'segment.com', 'mixpanel.com', 'amplitude.com', 'hotjar.com', 'hotjar.io',
    'sentry.io', 'datadoghq.com', 'browser-intake-datadoghq', 'newrelic.com', 'nr-data.net',
    'fullstory.com', 'clarity.ms', 'intercom.io', 'heap.io', 'posthog.com', 'plausible.io'
]

const STATIC = /\.(png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|map|woff2?|ttf|otf|eot|mp4|webm|mp3|wav)$/i
const ID_SEGMENT = /^(\d+|[0-9a-f]{8,}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[A-Za-z0-9_-]{20,})$/i

export function resolveEffectsConfig (option?: EffectsMode | { mode?: EffectsMode, ignore?: (string | RegExp)[] }): EffectsConfig {
    if (typeof option === 'string') {
        return { mode: option, ignore: DEFAULT_IGNORE }
    }
    return { mode: option?.mode ?? 'strict', ignore: [...DEFAULT_IGNORE, ...(option?.ignore || [])] }
}

/**
 * `/api/cart/123?x=1` → `/api/cart/:id`. The host is kept when it is not
 * the host of the page.
 */
export function urlTemplate (url: string, pageUrl?: string) {
    let parsed: URL
    try {
        parsed = new URL(url, pageUrl)
    } catch {
        return url
    }
    if (parsed.protocol === 'about:' || parsed.protocol === 'data:') {
        return parsed.protocol === 'about:' ? url : 'data:'
    }
    const path = parsed.pathname.split('/').map((segment) => ID_SEGMENT.test(segment) ? ':id' : segment).join('/') || '/'
    let samehost = false
    try {
        samehost = Boolean(pageUrl) && new URL(pageUrl!).host === parsed.host
    } catch {
        samehost = false
    }
    return samehost || !pageUrl ? path : `${parsed.host}${path}`
}

export function statusClass (status?: number, failed?: boolean) {
    if (failed || !status) {
        return 'failed'
    }
    return `${Math.floor(status / 100)}xx`
}

export function isIgnored (url: string, ignore: (string | RegExp)[]) {
    return ignore.some((pattern) => typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url))
}

/**
 * a request that is part of an effect: fetch and XHR calls, not documents,
 * images, styles, scripts, fonts, websockets or beacons
 */
export function isEffectRequest (request: { url: string, initiatorType?: string | null, destination?: string, navigation?: string | null }) {
    if (request.navigation) {
        return false
    }
    if (/^wss?:/.test(request.url)) {
        return false
    }
    if (request.initiatorType) {
        return request.initiatorType === 'fetch' || request.initiatorType === 'xmlhttprequest'
    }
    if (request.destination) {
        return false
    }
    try {
        return !STATIC.test(new URL(request.url).pathname)
    } catch {
        return false
    }
}

export function isEmpty (effect?: StepEffect) {
    return !effect || !(effect.requests?.length || effect.navigation || effect.opened || effect.changed?.length || effect.prompt)
}

export function describeEffect (effect: StepEffect) {
    return [
        ...(effect.requests || []),
        ...(effect.navigation ? [`navigation to ${effect.navigation}`] : []),
        ...(effect.opened ? [`a new window with ${effect.opened}`] : []),
        ...(effect.changed || []).map((region) => `a change in ${region}`),
        ...(effect.prompt ? [`a ${effect.prompt} dialog`] : [])
    ].join(', ')
}

/**
 * What the recorded effect had that the actual effect lacks. `strict`
 * needs every part, `loose` the navigation and one request or region.
 * An empty list means the effects match.
 */
export function missingEffects (expected: StepEffect | undefined, actual: StepEffect, mode: EffectsMode): string[] {
    if (mode === 'off' || isEmpty(expected)) {
        return []
    }
    const want = expected!
    const missing: string[] = []
    if (want.navigation && actual.navigation !== want.navigation) {
        missing.push(`navigation to ${want.navigation}`)
    }
    if (mode === 'loose') {
        const parts = [...(want.requests || []), ...(want.changed || [])]
        const seen = new Set([...(actual.requests || []), ...(actual.changed || [])])
        if (parts.length && !parts.some((part) => seen.has(part))) {
            missing.push(`one of ${parts.join(', ')}`)
        }
        return missing
    }
    const requests = new Set(actual.requests || [])
    missing.push(...(want.requests || []).filter((request) => !requests.has(request)))
    if (want.opened && actual.opened !== want.opened) {
        missing.push(`a new window with ${want.opened}`)
    }
    const changed = new Set(actual.changed || [])
    missing.push(...(want.changed || []).filter((region) => !changed.has(region)).map((region) => `a change in ${region}`))
    if (want.prompt && actual.prompt !== want.prompt) {
        missing.push(`a ${want.prompt} dialog`)
    }
    return missing
}

/**
 * The part of an effect a WebDriver Classic session can observe: the
 * navigation and the regions that changed. Requests, new windows and
 * dialogs need BiDi events.
 */
export function observableWithoutBidi (effect?: StepEffect): StepEffect | undefined {
    if (!effect) {
        return undefined
    }
    return {
        ...(effect.navigation ? { navigation: effect.navigation } : {}),
        ...(effect.changed?.length ? { changed: effect.changed } : {})
    }
}

/**
 * the effect of several steps together, e.g. the steps a model took to
 * continue from a failed step
 */
export function mergeEffects (effects: (StepEffect | undefined)[]): StepEffect {
    const merged: StepEffect = {}
    for (const effect of effects) {
        if (!effect) {
            continue
        }
        if (effect.requests?.length) {
            merged.requests = [...new Set([...(merged.requests || []), ...effect.requests])].sort()
        }
        if (effect.changed?.length) {
            merged.changed = [...new Set([...(merged.changed || []), ...effect.changed])].sort()
        }
        merged.navigation = effect.navigation ?? merged.navigation
        merged.opened = effect.opened ?? merged.opened
        merged.prompt = effect.prompt ?? merged.prompt
    }
    return merged
}

/**
 * A replayed step ran but did not do what it did when it was recorded.
 */
export class EffectMismatchError extends Error {
    readonly missing: string[]
    constructor (missing: string[]) {
        super(`the step no longer causes ${missing.join(', ')}`)
        this.name = 'EffectMismatchError'
        this.missing = missing
    }
}
