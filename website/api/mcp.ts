/**
 * WebdriverIO docs MCP server, served at https://webdriver.io/mcp (see the
 * rewrite in `vercel.json`).
 *
 * Stateless Streamable HTTP transport: every request creates a new server,
 * so the function scales to zero and needs no session store. The docs corpus
 * (`llms.txt` and the Markdown twin of every page) is bundled with the
 * function through `includeFiles` and read from disk.
 */
import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { z } from 'zod'

const SITE_URL = 'https://webdriver.io'
const BUILD_DIR = process.env.DOCS_BUILD_DIR || path.join(process.cwd(), 'build')

interface DocEntry {
    title: string
    url: string
    description: string
    section: string
    file: string
}

interface Section {
    title: string
    bundle?: string
    pages: number
}

let corpus: { entries: DocEntry[], sections: Section[], content: Map<string, string> } | undefined

function loadCorpus () {
    if (corpus) {
        return corpus
    }
    const entries: DocEntry[] = []
    const sections: Section[] = []
    let section = ''
    for (const line of fs.readFileSync(path.join(BUILD_DIR, 'llms.txt'), 'utf-8').split('\n')) {
        const heading = line.match(/^(##+) (.+)$/)
        if (heading) {
            section = heading[2]
            if (heading[1] === '##' && section !== 'Optional') {
                sections.push({ title: section, pages: 0 })
            }
            continue
        }
        const bundle = line.match(/^All pages of this section in one file: (\S+)$/)
        if (bundle && sections.length) {
            sections[sections.length - 1].bundle = bundle[1]
            continue
        }
        const link = line.match(/^- \[(.+?)\]\((https:\/\/webdriver\.io(\/(?:docs|community)\/[^)]+\.md))\)(?:: (.*))?$/)
        if (link) {
            entries.push({ title: link[1], url: link[2], description: link[4] || '', section, file: link[3] })
            if (sections.length) {
                sections[sections.length - 1].pages++
            }
        }
    }
    corpus = { entries, sections, content: new Map() }
    return corpus
}

function readPage (file: string) {
    const { content } = loadCorpus()
    if (!content.has(file)) {
        const resolved = path.resolve(BUILD_DIR, `.${file}`)
        if (!resolved.startsWith(path.join(BUILD_DIR, path.sep)) || !fs.existsSync(resolved)) {
            return undefined
        }
        content.set(file, fs.readFileSync(resolved, 'utf-8'))
    }
    return content.get(file)
}

const tokenize = (text: string) => text.toLowerCase().split(/[^a-z0-9$]+/).filter((t) => t.length > 1)

function search (query: string, limit: number) {
    const terms = tokenize(query)
    const { entries } = loadCorpus()
    return entries
        .map((entry) => {
            const title = tokenize(entry.title)
            const description = tokenize(entry.description)
            const url = tokenize(entry.file)
            const body = (readPage(entry.file) || '').toLowerCase()
            let score = 0
            for (const term of terms) {
                score += title.includes(term) ? 6 : 0
                score += url.includes(term) ? 4 : 0
                score += description.filter((t) => t === term).length * 2
                score += Math.min(body.split(term).length - 1, 10) * 0.3
            }
            if (entry.title.toLowerCase() === query.toLowerCase()) {
                score += 20
            }
            return { entry, score }
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ entry }) => entry)
}

/**
 * accepts `/docs/api/browser/url`, `docs/api/browser/url.md` or a full
 * webdriver.io URL and returns the path of the Markdown twin
 */
function toMarkdownPath (input: string) {
    const pathname = input.trim().replace(/^https?:\/\/(www\.)?webdriver\.io/, '').replace(/[?#].*$/, '').replace(/\/$/, '')
    const normalized = `/${pathname.replace(/^\//, '')}`
    return normalized.endsWith('.md') ? normalized : `${normalized}.md`
}

function createServer () {
    const server = new McpServer({ name: 'webdriverio-docs', version: '1.0.0' }, {
        instructions: 'Documentation of WebdriverIO v10, the test automation framework for web, mobile and desktop apps. Use search_docs to find relevant pages, then get_page to read them before writing WebdriverIO code. All WebdriverIO commands are async and must be awaited.'
    })

    server.registerTool('search_docs', {
        title: 'Search WebdriverIO docs',
        description: 'Search the WebdriverIO v10 documentation (guides, API reference, services and reporters). Returns the best matching pages with their URL and summary.',
        inputSchema: {
            query: z.string().min(1).describe('What you are looking for, e.g. "mock network request" or "browser.url"'),
            limit: z.number().int().min(1).max(25).default(8).describe('Maximum number of results'),
        },
        annotations: { readOnlyHint: true, openWorldHint: false },
    }, async ({ query, limit }) => {
        const results = search(query, limit)
        const text = results.length
            ? results.map((r, i) => `${i + 1}. ${r.title} (${r.section})\n   ${r.url}\n   ${r.description}`).join('\n\n')
            : `No pages found for "${query}". Try other keywords or call list_sections.`
        return { content: [{ type: 'text', text }] }
    })

    server.registerTool('get_page', {
        title: 'Read a WebdriverIO docs page',
        description: 'Returns the full Markdown of a WebdriverIO documentation page.',
        inputSchema: {
            url: z.string().min(1).describe('Page URL or path, e.g. "https://webdriver.io/docs/api/browser/url" or "/docs/selectors"'),
        },
        annotations: { readOnlyHint: true, openWorldHint: false },
    }, async ({ url }) => {
        const file = toMarkdownPath(url)
        const markdown = /^\/(docs|community)\//.test(file) ? readPage(file) : undefined
        if (!markdown) {
            return {
                isError: true,
                content: [{ type: 'text', text: `No documentation page found at ${SITE_URL}${file}. Use search_docs to find the right URL.` }]
            }
        }
        return { content: [{ type: 'text', text: markdown }] }
    })

    server.registerTool('list_sections', {
        title: 'List WebdriverIO docs sections',
        description: 'Lists the sections of the WebdriverIO documentation with the URL of a single file containing all pages of each section.',
        inputSchema: {},
        annotations: { readOnlyHint: true, openWorldHint: false },
    }, async () => {
        const { sections } = loadCorpus()
        const text = sections.map((s) => `- ${s.title} (${s.pages} pages)${s.bundle ? `: ${s.bundle}` : ''}`).join('\n')
        return { content: [{ type: 'text', text: `${text}\n\nIndex of all pages: ${SITE_URL}/llms.txt` }] }
    })

    return server
}

export default async function handler (req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID')
    res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id')

    if (req.method === 'OPTIONS') {
        res.statusCode = 204
        return res.end()
    }

    if (req.method === 'GET' && !req.headers.accept?.includes('text/event-stream')) {
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
        return res.end([
            '# WebdriverIO docs MCP server',
            '',
            `This is a Model Context Protocol server (Streamable HTTP) for the WebdriverIO documentation. Add \`${SITE_URL}/mcp\` as a remote MCP server to your agent, e.g.:`,
            '',
            '```json',
            JSON.stringify({ mcpServers: { 'webdriverio-docs': { url: `${SITE_URL}/mcp` } } }, null, 2),
            '```',
            '',
            'Tools: `search_docs`, `get_page`, `list_sections`.',
            ''
        ].join('\n'))
    }

    const server = createServer()
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
    res.on('close', () => {
        transport.close()
        server.close()
    })
    await server.connect(transport)
    await transport.handleRequest(req, res, req.body)
}
