import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const AGENT_SECTION_HEADING = '## End-to-end tests (WebdriverIO v10)'

/**
 * The project-rules block from `website/docs/AIAgents.md`, plus a line that
 * points at the installed skill. Kept here so `npm init wdio` can write it
 * without the website package.
 */
export const AGENT_SECTION = `${AGENT_SECTION_HEADING}

- Docs: https://webdriver.io/llms.txt - fetch the relevant page as Markdown (append \`.md\`) before using an API you are not sure about. Do not use APIs from WebdriverIO v8 or older.
- Config: \`wdio.conf.ts\`. Specs: \`test/specs/**/*.e2e.ts\`. Page objects: \`test/pageobjects/\`.
- Run all tests: \`npx wdio run wdio.conf.ts\`
- Run a single spec: \`npx wdio run wdio.conf.ts --spec test/specs/login.e2e.ts\`
- Tests are async: always \`await\` commands, e.g. \`await $('button').click()\`. Never use the removed sync mode.
- Prefer user-facing selectors: accessibility name or text (\`$('aria/Submit')\`, \`$('button=Submit')\`), then \`data-testid\`. Avoid XPath and generated CSS classes.
- Rely on auto-waiting and \`expect-webdriverio\` matchers (\`await expect($('h1')).toHaveText('Welcome')\`) instead of \`browser.pause()\`.
- To explore the app or verify a selector, use the \`wdio-mcp\` MCP server.
- To drive the app from the shell, follow \`.agents/skills/wdio-session/SKILL.md\` (\`npx wdio session\`).
- When a test fails, read the DevTools trace in \`test-results/\` (see \`transcript.md\`) before changing code.
`

function readIfExists (file: string) {
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : undefined
}

/**
 * The skill ships in this repo at `@wdio/session` and, for the published
 * `create-wdio` package, as `templates/wdio-session/SKILL.md`.
 */
export function readSessionSkill (start = path.dirname(fileURLToPath(import.meta.url))) {
    let dir = start
    for (let i = 0; i < 8; i++) {
        const candidates = [
            path.join(dir, 'wdio-session', 'src', 'skill', 'SKILL.md'),
            path.join(dir, 'packages', 'wdio-session', 'src', 'skill', 'SKILL.md'),
            path.join(dir, 'node_modules', '@wdio', 'session', 'src', 'skill', 'SKILL.md'),
            path.join(dir, 'templates', 'wdio-session', 'SKILL.md')
        ]
        for (const candidate of candidates) {
            const markdown = readIfExists(candidate)
            if (markdown) {
                return markdown
            }
        }
        const parent = path.dirname(dir)
        if (parent === dir) {
            break
        }
        dir = parent
    }
    throw new Error('Cannot find the wdio-session skill (src/skill/SKILL.md).')
}

/**
 * Write the skill, the AGENTS.md section and `.wdio/session/` in `.gitignore`.
 */
export function writeAgentSupport (root: string) {
    const skillDest = path.join(root, '.agents', 'skills', 'wdio-session', 'SKILL.md')
    if (!fs.existsSync(skillDest)) {
        const markdown = readSessionSkill()
        fs.mkdirSync(path.dirname(skillDest), { recursive: true })
        fs.writeFileSync(skillDest, markdown)
    }

    const agentsPath = path.join(root, 'AGENTS.md')
    const agents = readIfExists(agentsPath) || ''
    if (!agents.includes(AGENT_SECTION_HEADING)) {
        const sep = agents.length === 0 ? '' : agents.endsWith('\n') ? '\n' : '\n\n'
        fs.writeFileSync(agentsPath, agents + sep + AGENT_SECTION)
    }

    const gitignorePath = path.join(root, '.gitignore')
    const gitignore = readIfExists(gitignorePath) || ''
    const hasEntry = gitignore.split('\n').some((line) => line.trim() === '.wdio/session/' || line.trim() === '.wdio/session')
    if (!hasEntry) {
        const sep = gitignore.length === 0 || gitignore.endsWith('\n') ? '' : '\n'
        fs.writeFileSync(gitignorePath, `${gitignore}${sep}.wdio/session/\n`)
    }
}
