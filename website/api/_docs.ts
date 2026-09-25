/**
 * Docs corpus shared by the MCP server (`api/mcp.ts`) and the docs eval
 * (`scripts/docs-generation/evalDocs.ts`). Files prefixed with `_` in `api/`
 * are not deployed as functions.
 */
import fs from 'node:fs'
import path from 'node:path'

export const SITE_URL = 'https://webdriver.io'
const BUILD_DIR = process.env.DOCS_BUILD_DIR || path.join(process.cwd(), 'build')

export interface DocEntry {
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

export function loadCorpus () {
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

export function readPage (file: string) {
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

const STOPWORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'before', 'by', 'can', 'do', 'for', 'from', 'how', 'i', 'in', 'into',
    'is', 'it', 'its', 'my', 'of', 'on', 'only', 'or', 'so', 'the', 'this', 'to', 'use', 'using', 'with', 'webdriverio', 'wdio'
])

/**
 * lowercases, drops stopwords and strips common suffixes so that e.g.
 * "shard", "sharding" and "shards" match each other
 */
const stem = (token: string) => token.length > 4 ? token.replace(/(ing|ed|es|s)$/, '') : token
const tokenize = (text: string) => text
    .toLowerCase()
    .split(/[^a-z0-9$]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem)

const bodyTokens = new Map<string, Map<string, number>>()
function termFrequencies (file: string) {
    if (!bodyTokens.has(file)) {
        const counts = new Map<string, number>()
        for (const token of tokenize(readPage(file) || '')) {
            counts.set(token, (counts.get(token) || 0) + 1)
        }
        bodyTokens.set(file, counts)
    }
    return bodyTokens.get(file)!
}

export function search (query: string, limit: number) {
    const terms = [...new Set(tokenize(query))]
    const { entries } = loadCorpus()
    return entries
        .map((entry) => {
            const title = tokenize(entry.title)
            const description = tokenize(entry.description)
            const url = tokenize(entry.file.replace(/\.md$/, ''))
            const body = termFrequencies(entry.file)
            const bodyLength = [...body.values()].reduce((sum, n) => sum + n, 0) || 1
            let score = 0
            for (const term of terms) {
                score += title.includes(term) ? 6 : 0
                score += url.includes(term) ? 3 : 0
                score += description.includes(term) ? 2 : 0
                /**
                 * term frequency normalised by page length, so that long
                 * index pages don't outrank the page about the topic
                 */
                score += Math.min(((body.get(term) || 0) / bodyLength) * 400, 4)
            }
            const matched = terms.filter((term) => title.includes(term) || description.includes(term) || body.has(term)).length
            score *= terms.length ? matched / terms.length : 0
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
export function toMarkdownPath (input: string) {
    const pathname = input.trim().replace(/^https?:\/\/(www\.)?webdriver\.io/, '').replace(/[?#].*$/, '').replace(/\/$/, '')
    const normalized = `/${pathname.replace(/^\//, '')}`
    return normalized.endsWith('.md') ? normalized : `${normalized}.md`
}
