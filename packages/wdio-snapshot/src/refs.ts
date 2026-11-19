import type {} from 'webdriverio'

import type { SerializedSelectorProvider } from './providers.js'
import { SnapshotError } from './errors.js'

export const REF_PATTERN = /^e\d+$/

export type RefErrorCode = 'REF_NOT_FOUND' | 'REF_STALE'

/**
 * `resnapshot` is true where taking a new snapshot would fix the error, so a
 * consumer can attach its own recovery hint.
 */
export type RefErrorFactory = (code: RefErrorCode, message: string, opts: { resnapshot: boolean }) => Error

export interface RefEntry {
    id: string
    kind: 'web' | 'native'
    role: string
    name?: string
    /**
     * stable selector candidates, best first (§8.5)
     */
    candidates: string[]
    /**
     * validated stable selector, computed lazily
     */
    selector?: string
    /**
     * no candidate matched the element alone, e.g. it is inside a closed
     * shadow root: `selector` is a best guess that may not replay
     */
    unverified?: boolean
    /**
     * snapshot generation the ref was last seen in
     */
    generation: number
    /**
     * ref of the iframe the element is in, for elements of a frame the
     * snapshot showed inline (actions on it enter that frame first)
     */
    frame?: string
}

/**
 * `e12` and `@e12` are the same ref. The `@` form is what other agent
 * browsers print; snapshots from this CLI print `e12`.
 */
export function refId (value: string): string | undefined {
    const id = value.startsWith('@') ? value.slice(1) : value
    return REF_PATTERN.test(id) ? id : undefined
}

const PROVIDER_NAME_PATTERN = '[a-z][\\w-]*'
export const PROVIDER_NAME = new RegExp(`^${PROVIDER_NAME_PATTERN}$`)
const PROVIDER_SELECTOR = new RegExp(`^(${PROVIDER_NAME_PATTERN}):(.*)$`, 's')

/**
 * Names of the providers that have a `locator`: only those resolve `name:arg` selectors
 */
export function locatorProviderNames (list: Pick<SerializedSelectorProvider, 'name' | 'locator'>[] = []): string[] {
    return list.filter((provider) => provider.locator).map((provider) => provider.name)
}

/**
 * `name` and `arg` of a `name:arg` selector of one of the `names` providers, else undefined
 */
export function parseProviderSelector (selector: string, names: string[]): { name: string, arg: string } | undefined {
    const match = PROVIDER_SELECTOR.exec(selector)
    return match && names.includes(match[1]) ? { name: match[1], arg: match[2] } : undefined
}

/**
 * `name:arg` selectors of a registered selector provider go to `custom$$`, anything else to `$$`
 */
export function queryAll (browser: WebdriverIO.Browser, selector: string, providerNames: string[] = []) {
    const provider = parseProviderSelector(selector, providerNames)
    return provider ? browser.custom$$(provider.name, provider.arg) : browser.$$(selector)
}

export const refFunction = (id: string) => new Function(`return (window.__wdioSession && window.__wdioSession.refs.get(${JSON.stringify(id)}) || { deref: function () { return null } }).deref() || null`) as () => HTMLElement

export class RefRegistry {
    #entries = new Map<string, RefEntry>()
    #counter = 0
    generation = 0
    #createError: RefErrorFactory
    #providerNames: string[]

    constructor (opts: { createError?: RefErrorFactory, providerNames?: string[] } = {}) {
        this.#createError = opts.createError ?? ((code, message) => new SnapshotError(code, message))
        this.#providerNames = opts.providerNames ?? []
    }

    get counter () {
        return this.#counter
    }

    set counter (value: number) {
        this.#counter = Math.max(this.#counter, value)
    }

    allocate () {
        return `e${++this.#counter}`
    }

    set (entry: RefEntry) {
        const previous = this.#entries.get(entry.id)
        if (previous && previous.candidates.join('\n') === entry.candidates.join('\n')) {
            entry.selector = previous.selector
            entry.unverified = previous.unverified
        }
        this.#entries.set(entry.id, entry)
    }

    get (id: string) {
        return this.#entries.get(id)
    }

    all () {
        return [...this.#entries.values()]
    }

    /**
     * Resolve a ref to an element. Throws `REF_NOT_FOUND` for unknown ids
     * and `REF_STALE` when the element is gone.
     */
    async resolve (browser: WebdriverIO.Browser, id: string): Promise<WebdriverIO.Element> {
        const entry = this.#entries.get(id)
        if (!entry) {
            throw this.#createError('REF_NOT_FOUND', `${id} was never assigned in this session.`, { resnapshot: true })
        }
        const stale = () => this.#createError('REF_STALE', `${id} no longer exists on the page.`, { resnapshot: true })
        if (entry.kind === 'web') {
            const el = await browser.$(refFunction(id)).getElement()
            if (!el.elementId) {
                throw stale()
            }
            return el
        }
        for (const candidate of entry.selector ? [entry.selector] : entry.candidates) {
            const els = await queryAll(browser, candidate, this.#providerNames).getElements()
            if (els.length === 1) {
                entry.selector = candidate
                return els[0]
            }
        }
        throw stale()
    }

    /**
     * The first candidate that matches exactly the ref's element.
     */
    async stableSelector (browser: WebdriverIO.Browser, id: string, element?: WebdriverIO.Element): Promise<string> {
        const entry = this.#entries.get(id)
        if (!entry) {
            throw this.#createError('REF_NOT_FOUND', `${id} was never assigned in this session.`, { resnapshot: false })
        }
        if (entry.selector) {
            return entry.selector
        }
        const last = entry.candidates.at(-1)
        if (!last) {
            throw this.#createError('REF_STALE', `${id} has no selector matching its element.`, { resnapshot: true })
        }
        if (entry.kind === 'native') {
            await this.resolve(browser, id)
            return entry.selector || entry.candidates[0]
        }
        const target = element || await this.resolve(browser, id)
        for (const candidate of entry.candidates) {
            try {
                const els = await queryAll(browser, candidate, this.#providerNames).getElements()
                if (els.length === 1 && await els[0].isEqual(target)) {
                    entry.selector = candidate
                    return candidate
                }
            } catch {
                // invalid or ambiguous candidate, try the next one
            }
        }
        entry.selector = last
        entry.unverified = true
        return last
    }
}
