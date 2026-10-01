/**
 * Last override this session applied, keyed by browsing context, and which
 * restore function is still the latest for a scope in that context.
 *
 * Device emulation reads this when a later command is rejected, so it can put
 * back the previous override instead of clearing to a default. An older
 * `restore()` for the same scope and context becomes a no-op once a newer
 * call has replaced it.
 */

export interface RememberedViewport {
    width: number
    height: number
    devicePixelRatio: number
}

export interface RememberedOverrides {
    userAgent?: string | null
    touch?: number | null
    textLayout?: 'mobile' | null
    viewportMeta?: true | null
    viewport?: RememberedViewport | null
}

const overrides = new WeakMap<WebdriverIO.Browser, Map<string, RememberedOverrides>>()
const latestRestore = new WeakMap<WebdriverIO.Browser, Map<string, symbol>>()

function overrideMap (browser: WebdriverIO.Browser) {
    let map = overrides.get(browser)
    if (!map) {
        map = new Map()
        overrides.set(browser, map)
    }
    return map
}

export function rememberOverride (browser: WebdriverIO.Browser, context: string, patch: RememberedOverrides) {
    const map = overrideMap(browser)
    map.set(context, { ...map.get(context), ...patch })
}

export function rememberedOverride (browser: WebdriverIO.Browser, context: string): RememberedOverrides {
    return overrideMap(browser).get(context) ?? {}
}

/**
 * Mark `token` as the restore that owns `scope` for these contexts.
 * The returned function is true only for that latest call.
 */
export function claimRestore (browser: WebdriverIO.Browser, scope: string, contexts: string[]) {
    const key = `${scope}:${contexts.join(',')}`
    let map = latestRestore.get(browser)
    if (!map) {
        map = new Map()
        latestRestore.set(browser, map)
    }
    const token = Symbol()
    map.set(key, token)
    return () => map.get(key) === token
}
