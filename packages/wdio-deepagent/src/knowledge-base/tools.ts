import { tool } from 'langchain'
import type { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { CappedMap } from '../capped-map.js'

/**
 * In-memory knowledge base of the site under test: a11y snapshots and
 * element maps accumulated while the agent browses (context-injection
 * only — no embeddings in v1 (plain context injection).
 */
export interface SiteSnapshot {
    url: string
    /** Depth-indented accessibility-tree snapshot text. */
    snapshot: string
    /** Flat list of interactable elements (JSON). */
    elements: string
    /** When the snapshot was recorded. */
    recordedAt: number
}

export const MAX_KB_ENTRIES = 32

function kbTool<T extends z.ZodString | z.ZodObject<z.ZodRawShape>>(
    name: string,
    description: string,
    schema: T,
    fn: (input: z.output<T>) => Promise<string>,
): DynamicStructuredTool {
    return tool(fn, { name, description, schema }) as DynamicStructuredTool
}

export function createKnowledgeBaseTools(store = new CappedMap<string, SiteSnapshot>(MAX_KB_ENTRIES)): DynamicStructuredTool[] {
    const knowledgeBase = store
    const rememberSnapshot = kbTool(
        'remember_snapshot',
        'Store an accessibility/element snapshot of the current page for later reference.',
        z.object({
            url: z.string(),
            snapshot: z.string(),
            elements: z.string().default(''),
        }),
        async ({ url, snapshot, elements }) => {
            knowledgeBase.set(normalizeUrl(url), { url, snapshot, elements, recordedAt: Date.now() })
            return `Remembered snapshot for ${url} (${knowledgeBase.size} pages in knowledge base).`
        },
    )

    const queryKnowledgeBase = kbTool(
        'query_knowledge_base',
        'Look up a remembered page snapshot (by URL). Without a URL, lists all remembered pages.',
        z.object({ url: z.string().optional() }),
        async ({ url }) => {
            const key = url ? normalizeUrl(url) : undefined
            if (key && knowledgeBase.has(key)) {
                const s = knowledgeBase.get(key)!
                return JSON.stringify({ found: true, url: s.url, recordedAt: s.recordedAt, snapshot: s.snapshot, elements: s.elements })
            }
            // Relative query URLs carry no host: match by pathname only.
            if (key && !/^[a-z][a-z0-9+.-]*:/i.test(url!)) {
                const path = key.split('|', 2)[1]
                const found = [...knowledgeBase.values()].reverse().find((s) => parseUrl(s.url).pathname === path)
                if (found) {
                    return JSON.stringify({ found: true, url: found.url, recordedAt: found.recordedAt, snapshot: found.snapshot, elements: found.elements })
                }
            }
            const pages = [...knowledgeBase.values()].map((s) => s.url)
            return JSON.stringify({ found: false, pages })
        },
    )

    const clearKnowledgeBase = kbTool(
        'clear_knowledge_base',
        'Forget all remembered page snapshots.',
        z.object({}),
        async () => {
            const n = knowledgeBase.size
            knowledgeBase.clear()
            return `Cleared ${n} remembered snapshot(s).`
        },
    )

    return [rememberSnapshot, queryKnowledgeBase, clearKnowledgeBase]
}

const KB_HOST = 'http://kb.local'
const KB_DEFAULT_HOST = new URL(KB_HOST).host

function parseUrl(url: string): URL {
    return new URL(url, KB_HOST)
}

/** Key on host + pathname so distinct hosts never collide; relative and absolute forms of the same page key differently (see the query fallback above). */
function normalizeUrl(url: string): string {
    const parsed = parseUrl(url)
    const path = parsed.pathname.replace(/\/$/, '') || '/'
    const host = parsed.host === KB_DEFAULT_HOST ? '' : parsed.host.toLowerCase()
    return `${host}|${path}`
}
