import { SessionError } from '../errors.js'
import { REF_PATTERN } from '../constants.js'

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
     * snapshot generation the ref was last seen in
     */
    generation: number
}

export const isRef = (value: unknown): value is string => typeof value === 'string' && REF_PATTERN.test(value)

export const refFunction = (id: string) => new Function(`return (window.__wdioSession && window.__wdioSession.refs.get(${JSON.stringify(id)}) || { deref: function () { return null } }).deref() || null`) as () => HTMLElement

export class RefRegistry {
    #entries = new Map<string, RefEntry>()
    #counter = 0
    generation = 0

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
            throw new SessionError('REF_NOT_FOUND', `${id} was never assigned in this session.`, {
                hint: 'Run `wdio session snapshot` to get refs.'
            })
        }
        const stale = () => new SessionError('REF_STALE', `${id} no longer exists on the page.`, {
            hint: 'Run `wdio session snapshot` to get fresh refs.'
        })
        if (entry.kind === 'web') {
            const el = await browser.$(refFunction(id)).getElement()
            if (!el.elementId) {
                throw stale()
            }
            return el
        }
        for (const candidate of entry.selector ? [entry.selector] : entry.candidates) {
            const els = await browser.$$(candidate).getElements()
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
            throw new SessionError('REF_NOT_FOUND', `${id} was never assigned in this session.`)
        }
        if (entry.selector) {
            return entry.selector
        }
        if (entry.kind === 'native') {
            await this.resolve(browser, id)
            return entry.selector || entry.candidates[0]
        }
        const target = element || await this.resolve(browser, id)
        for (const candidate of entry.candidates) {
            try {
                const els = await browser.$$(candidate).getElements()
                if (els.length === 1 && await els[0].isEqual(target)) {
                    entry.selector = candidate
                    return candidate
                }
            } catch {
                // invalid or ambiguous candidate, try the next one
            }
        }
        const last = entry.candidates.at(-1)!
        entry.selector = last
        return last
    }
}
