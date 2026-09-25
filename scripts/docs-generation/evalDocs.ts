#!/usr/bin/env node
/**
 * Measures how well the docs serve coding agents, using the tasks in
 * `website/evals/tasks.json` and the same search the docs MCP server uses.
 *
 * - retrieval (default): does `search_docs` return one of the expected pages
 *   in the top 5 for each task? Deterministic, runs in CI without secrets.
 * - agent (`--agent`): an LLM solves every task with only the `search_docs`
 *   and `get_page` tools and is graded on whether its answer contains the
 *   expected APIs. Requires ANTHROPIC_API_KEY, the model can be set with
 *   EVAL_MODEL.
 *
 * Usage: tsx scripts/docs-generation/evalDocs.ts [--agent] [--min-hit-rate=0.8]
 * Requires a built site (`website/build`).
 */
import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const WEBSITE_DIR = path.join(__dirname, '..', '..', 'website')
process.env.DOCS_BUILD_DIR ??= path.join(WEBSITE_DIR, 'build')

const { search, readPage, toMarkdownPath } = await import('../../website/api/_docs.js')

interface Task {
    id: string
    task: string
    query: string
    pages: string[]
    mustInclude: string[]
}

const tasks: Task[] = JSON.parse(fs.readFileSync(path.join(WEBSITE_DIR, 'evals', 'tasks.json'), 'utf-8'))
const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
const minHitRate = Number(arg('min-hit-rate') ?? 0)

const toPage = (file: string) => file.replace(/\.md$/, '')
const rank = (query: string, expected: string[]) => {
    const results = search(query, 5).map((r) => toPage(r.file))
    const index = results.findIndex((r) => expected.includes(r))
    return { rank: index === -1 ? undefined : index + 1, top: results[0] }
}

function retrieval () {
    const rows = tasks.map((task) => ({
        task,
        keywords: rank(task.query, task.pages),
        natural: rank(task.task, task.pages),
    }))
    const rate = (key: 'keywords' | 'natural', k: number) => rows.filter((r) => r[key].rank && r[key].rank <= k).length / rows.length
    const pct = (n: number) => `${Math.round(n * 100)}%`

    console.log('task'.padEnd(18), 'keywords', 'natural ', 'top result for the natural language task')
    for (const { task, keywords, natural } of rows) {
        console.log(
            task.id.padEnd(18),
            String(keywords.rank ?? '-').padEnd(8),
            String(natural.rank ?? '-').padEnd(8),
            natural.rank === 1 ? '' : natural.top ?? '(no results)'
        )
    }
    console.log(`\nhit@1: keywords ${pct(rate('keywords', 1))}, natural language ${pct(rate('natural', 1))}`)
    console.log(`hit@5: keywords ${pct(rate('keywords', 5))}, natural language ${pct(rate('natural', 5))}`)

    if (rate('keywords', 5) < minHitRate) {
        console.error(`\nhit@5 for keyword queries is below the minimum of ${pct(minHitRate)}`)
        process.exit(1)
    }
}

async function agent () {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
        console.error('--agent requires ANTHROPIC_API_KEY')
        process.exit(1)
    }
    const model = process.env.EVAL_MODEL || 'claude-sonnet-4-5'
    const tools = [{
        name: 'search_docs',
        description: 'Search the WebdriverIO v10 documentation. Returns matching pages with URL and summary.',
        input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }
    }, {
        name: 'get_page',
        description: 'Returns the Markdown of a WebdriverIO documentation page.',
        input_schema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] }
    }]
    const runTool = (name: string, input: Record<string, string>, visited: Set<string>) => {
        if (name === 'search_docs') {
            return search(input.query, 8).map((r) => `${r.title}: ${r.url}\n${r.description}`).join('\n\n') || 'No results'
        }
        const file = toMarkdownPath(input.url)
        visited.add(toPage(file))
        return readPage(file) ?? 'Page not found'
    }

    let passed = 0
    for (const task of tasks) {
        const visited = new Set<string>()
        const messages: { role: string, content: unknown }[] = [{ role: 'user', content: `${task.task}. Answer with a short explanation and a complete code example.` }]
        let answer = ''
        for (let turn = 0; turn < 8; turn++) {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
                body: JSON.stringify({
                    model,
                    max_tokens: 2048,
                    system: 'You help users with WebdriverIO v10. You only know what the documentation tools return: always look up the relevant pages before answering.',
                    tools,
                    messages
                })
            })
            if (!response.ok) {
                throw new Error(`Anthropic API returned ${response.status}: ${await response.text()}`)
            }
            const message = await response.json() as { stop_reason: string, content: { type: string, text?: string, id?: string, name?: string, input?: Record<string, string> }[] }
            messages.push({ role: 'assistant', content: message.content })
            const toolUses = message.content.filter((c) => c.type === 'tool_use')
            if (message.stop_reason !== 'tool_use' || toolUses.length === 0) {
                answer = message.content.filter((c) => c.type === 'text').map((c) => c.text).join('\n')
                break
            }
            messages.push({
                role: 'user',
                content: toolUses.map((use) => ({ type: 'tool_result', tool_use_id: use.id, content: runTool(use.name!, use.input!, visited) }))
            })
        }
        const missing = task.mustInclude.filter((snippet) => !answer.includes(snippet))
        const foundPage = task.pages.some((p) => visited.has(p))
        const ok = missing.length === 0
        passed += ok ? 1 : 0
        console.log(`${ok ? 'PASS' : 'FAIL'} ${task.id}${missing.length ? ` (missing: ${missing.join(', ')})` : ''}${foundPage ? '' : ' (did not read an expected page)'}`)
    }
    console.log(`\n${passed}/${tasks.length} tasks solved with ${model}`)
}

if (process.argv.includes('--agent')) {
    await agent()
} else {
    retrieval()
}
