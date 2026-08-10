import { describe, expect, it } from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { parseDeepAgentConfig } from '../src/config/index.js'
import { interview, renderWdioConfig, runInit } from '../src/init/index.js'

/** Injectable prompter that answers every question from a queue. */
function prompter(answers: string[]) {
    let i = 0
    return async () => answers[i++] ?? ''
}

function extractDeepAgentBlock(rendered: string): unknown {
    // the deepagent block is the last top-level key — grab from `deepagent:` to the end
    const idx = rendered.indexOf('deepagent:')
    let block = rendered.slice(idx + 'deepagent:'.length).trim()
    // drop the config object's trailing `}` (the block is the last key)
    block = block.slice(0, block.lastIndexOf('}'))

    return new Function(`return ${block}`)()
}

describe('renderWdioConfig', () => {
    it('renders a mocha + TypeScript config with a valid deepagent block', () => {
        const answers = {
            framework: 'mocha',
            isUsingTypeScript: true,
            specDir: './test/specs/**/*.js',
            services: [],
            deepagentModel: { provider: 'openrouter', model: 'moonshotai/kimi-k3' },
            heal: 'ask',
        }
        const rendered = renderWdioConfig(answers as never)
        expect(rendered).toContain("framework: 'mocha'")
        expect(rendered).toContain('mochaOpts')
        expect(rendered).toContain("tsConfigPath: './tsconfig.json'")
        expect(rendered).toContain("services: [\n        'devtools'\n    ]")

        const cfg = parseDeepAgentConfig(extractDeepAgentBlock(rendered))
        expect(cfg.model).toMatchObject({ provider: 'openrouter', model: 'moonshotai/kimi-k3' })
        expect(cfg.heal).toBe('ask')
    })

    it('renders cucumber with feature specs and step-definition require', () => {
        const rendered = renderWdioConfig({
            framework: 'cucumber',
            isUsingTypeScript: false,
            featureDir: './features/**/*.feature',
            services: [],
            deepagentModel: { provider: 'ollama', model: 'llama3.1:8b' },
            heal: 'auto',
        } as never)
        expect(rendered).toContain("specs: ['./features/**/*.feature']")
        expect(rendered).toContain('cucumberOpts')
        expect(rendered).toContain("provider: 'ollama'")
        expect(rendered).toContain("heal: 'auto'")
    })
})

describe('interview', () => {
    it('collects and validates answers from the prompter', async () => {
        const answers = await interview(prompter([
            'cucumber',      // framework
            'yes',           // TS
            'appium',        // services
            '',              // cloud → local
            'anthropic',     // provider
            'claude-sonnet-4-6', // model
            'propose',       // heal
        ]))
        expect(answers.framework).toBe('cucumber')
        expect(answers.isUsingTypeScript).toBe(true)
        expect(answers.services).toEqual(['appium'])
        expect(answers.cloudProvider).toBeUndefined()
        expect(answers.deepagentModel).toEqual({ provider: 'anthropic', model: 'claude-sonnet-4-6' })
        expect(answers.heal).toBe('propose')
    })

    it('rejects invalid framework answers', async () => {
        await expect(interview(prompter(['karma']))).rejects.toThrow(/Expected one of/)
    })
})

describe('runInit', () => {
    it('writes a config file from injected answers', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-init-'))
        const configPath = path.join(dir, 'wdio.conf.ts')
        const result = await runInit({
            outputPath: configPath,
            prompt: prompter(['mocha', 'yes', '', '', 'openrouter', 'moonshotai/kimi-k3', 'ask']),
        })
        expect(result.wrote).toBe(true)
        const content = await fs.readFile(configPath, 'utf8')
        expect(content).toContain("framework: 'mocha'")
        expect(content).toContain('deepagent:')
        await fs.rm(dir, { recursive: true, force: true })
    })

    it('refuses to overwrite an existing config', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-init-'))
        const configPath = path.join(dir, 'wdio.conf.ts')
        await fs.writeFile(configPath, 'existing', 'utf8')
        await expect(runInit({
            outputPath: configPath,
            prompt: prompter(['mocha', 'yes', '', '', 'openrouter', 'moonshotai/kimi-k3', 'ask']),
        })).rejects.toThrow(/Refusing to overwrite/)
        await fs.rm(dir, { recursive: true, force: true })
    })

    it('rejects non-TTY stdin (readline hangs on pipes)', async () => {
        const tty = process.stdin.isTTY
        process.stdin.isTTY = undefined
        try {
            await expect(runInit()).rejects.toThrow(/interactive terminal/)
        } finally {
            process.stdin.isTTY = tty
        }
    })
})
