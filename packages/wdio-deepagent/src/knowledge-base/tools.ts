import { tool } from 'langchain'
import type { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

/**
 * In-memory knowledge base of the site under test: a11y snapshots and
 * element maps accumulated while the agent browses (context-injection
 * only — no embeddings in v1, see deepagent_repl_plan.md §10).
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

const knowledgeBase = new Map<string, SiteSnapshot>()

/**
 * Tools that ground later traversal and healing in what the agent
 * actually saw. Keys are URL-normalized; latest snapshot per page wins.
 */
export function createKnowledgeBaseTools(): DynamicStructuredTool[] {
    const rememberSnapshot = tool(
        async ({ url, snapshot, elements }) => {
            knowledgeBase.set(normalizeUrl(url), { url, snapshot, elements, recordedAt: Date.now() })
            return `Remembered snapshot for ${url} (${knowledgeBase.size} pages in knowledge base).`
        },
        {
            name: 'remember_snapshot',
            description: 'Store an accessibility/element snapshot of the current page for later reference.',
            schema: z.object({
                url: z.string(),
                snapshot: z.string(),
                elements: z.string().optional().default(''),
            }),
        },
    )

    const queryKnowledgeBase = tool(
        async ({ url }) => {
            const key = url ? normalizeUrl(url) : undefined
            if (key && knowledgeBase.has(key)) {
                const s = knowledgeBase.get(key)!
                return JSON.stringify({ found: true, url: s.url, recordedAt: s.recordedAt, snapshot: s.snapshot, elements: s.elements })
            }
            const pages = [...knowledgeBase.values()].map((s) => s.url)
            return JSON.stringify({ found: false, pages })
        },
        {
            name: 'query_knowledge_base',
            description: 'Look up a remembered page snapshot (by URL). Without a URL, lists all remembered pages.',
            schema: z.object({ url: z.string().optional() }),
        },
    )

    const clearKnowledgeBase = tool(
        async () => {
            const n = knowledgeBase.size
            knowledgeBase.clear()
            return `Cleared ${n} remembered snapshot(s).`
        },
        {
            name: 'clear_knowledge_base',
            description: 'Forget all remembered page snapshots.',
            schema: z.object({}),
        },
    )

    return [rememberSnapshot, queryKnowledgeBase, clearKnowledgeBase]
}

function normalizeUrl(url: string): string {
    try {
        return new URL(url).href.replace(/\/$/, '')
    } catch {
        return url
    }
}
