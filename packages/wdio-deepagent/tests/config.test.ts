import { describe, expect, it } from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { findDefaultConfigPath, loadDeepAgentConfig, parseDeepAgentConfig } from '../src/config/index.js'
import { parseInitAnswers, renderWdioConfig } from '../src/init/template.js'

const FIXTURE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'wdio.conf.ts')

describe('parseDeepAgentConfig', () => {
    it('applies defaults to a minimal block', () => {
        const cfg = parseDeepAgentConfig({ model: { provider: 'ollama', model: 'llama3.1:8b' } })
        expect(cfg.heal).toBe('ask')
        expect(cfg.traceDir).toBe('test-results')
        expect(cfg.permissions.projectRoot).toBe('.')
        expect(cfg.mcp.command).toBe('npx')
    })

    it('requires a model at load time, not parse time (read-only diagnose needs none)', () => {
        // parse-level: model is optional (propose diagnose builds no agent)
        const cfg = parseDeepAgentConfig({ heal: 'propose' })
        expect(cfg.model).toBeUndefined()
        // load-level enforcement happens in loadDeepAgentConfig (see below)
        expect(cfg.heal).toBe('propose')
    })

    it('rejects invalid heal modes', () => {
        expect(() => parseDeepAgentConfig({ model: { provider: 'openai', model: 'x' }, heal: 'sometimes' }))
            .toThrow()
    })
})

describe('loadDeepAgentConfig', () => {
    it('reads the deepagent block from a wdio.conf.ts', async () => {
        const cfg = await loadDeepAgentConfig({ configPath: FIXTURE, env: {} })
        expect(cfg.model).toMatchObject({ provider: 'openrouter', model: 'moonshotai/kimi-k3' })
        expect(cfg.heal).toBe('propose')
    })

    it('throws a helpful hint when no model is configured', async () => {
        await expect(loadDeepAgentConfig({ env: {} })).rejects.toThrow(/wdio-deepagent init/)
    })

    it('modelOptional allows a model-free config (read-only propose diagnose)', async () => {
        const cfg = await loadDeepAgentConfig({ env: {}, modelOptional: true })
        expect(cfg.model).toBeUndefined()
        expect(cfg.heal).toBe('ask')
        expect(cfg.traceDir).toBe('test-results')
    })

    it('merges DEEPAGENT_MODEL env over the file block (preserving other model fields)', async () => {
        const cfg = await loadDeepAgentConfig({
            configPath: FIXTURE,
            env: { DEEPAGENT_MODEL: 'anthropic:claude-sonnet-4-6' },
        })
        expect(cfg.model).toMatchObject({ provider: 'anthropic', model: 'claude-sonnet-4-6' })
    })

    it('drops the file block apiKey/baseURL when the override switches provider', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-cfg-'))
        await fs.writeFile(path.join(dir, 'wdio.conf.ts'), `
            export const config = { capabilities: {}, deepagent: {
                model: {
                    provider: 'openrouter', model: 'moonshotai/kimi-k3',
                    apiKey: 'sk-or-123', baseURL: 'https://openrouter.ai/api/v1',
                },
            } }`)
        try {
            const cfg = await loadDeepAgentConfig({ cwd: dir, env: {}, cli: { model: 'openai:gpt-5.5' } })
            expect(cfg.model).toMatchObject({ provider: 'openai', model: 'gpt-5.5' })
            expect(cfg.model!.apiKey).toBeUndefined()
            expect(cfg.model!.baseURL).toBeUndefined()
        } finally {
            await fs.rm(dir, { recursive: true, force: true })
        }
    })

    it('keeps the file block apiKey/baseURL when the override keeps the provider', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-cfg-'))
        await fs.writeFile(path.join(dir, 'wdio.conf.ts'), `
            export const config = { capabilities: {}, deepagent: {
                model: {
                    provider: 'openai', model: 'gpt-5.5',
                    apiKey: 'sk-openai', baseURL: 'https://api.openai.com/v1',
                },
            } }`)
        try {
            const cfg = await loadDeepAgentConfig({ cwd: dir, env: {}, cli: { model: 'openai:gpt-5.5-mini' } })
            expect(cfg.model).toMatchObject({
                provider: 'openai', model: 'gpt-5.5-mini',
                apiKey: 'sk-openai', baseURL: 'https://api.openai.com/v1',
            })
        } finally {
            await fs.rm(dir, { recursive: true, force: true })
        }
    })

    it('applies CLI flags with highest precedence', async () => {
        const cfg = await loadDeepAgentConfig({
            configPath: FIXTURE,
            env: { DEEPAGENT_HEAL: 'auto' },
            cli: { heal: 'ask', model: 'ollama:qwen2.5:7b' },
        })
        expect(cfg.heal).toBe('ask')
        expect(cfg.model).toMatchObject({ provider: 'ollama', model: 'qwen2.5:7b' })
    })

    it('env DEEPAGENT_HEAL overrides the file block', async () => {
        const cfg = await loadDeepAgentConfig({ configPath: FIXTURE, env: { DEEPAGENT_HEAL: 'auto' } })
        expect(cfg.heal).toBe('auto')
    })

    it('rejects malformed --model strings', async () => {
        await expect(loadDeepAgentConfig({ configPath: FIXTURE, env: {}, cli: { model: 'noprovider' } }))
            .rejects.toThrow(/provider:model/)
    })

    it('tolerates an unreadable config path (falls back to env/defaults)', async () => {
        const cfg = await loadDeepAgentConfig({
            configPath: '/nonexistent/wdio.conf.ts',
            env: { DEEPAGENT_MODEL: 'openai:gpt-5.5' },
        })
        expect(cfg.model).toMatchObject({ provider: 'openai', model: 'gpt-5.5' })
    })
})

describe('findDefaultConfigPath', () => {
    it('finds wdio.conf.ts in the cwd', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-cfg-'))
        const conf = path.join(dir, 'wdio.conf.ts')
        await fs.writeFile(conf, 'export const config = {}')
        try {
            expect(findDefaultConfigPath(dir)).toBe(conf)
        } finally {
            await fs.rm(dir, { recursive: true, force: true })
        }
    })

    it('falls through to the other supported extensions', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-cfg-'))
        const conf = path.join(dir, 'wdio.conf.cjs')
        await fs.writeFile(conf, 'exports.config = {}')
        try {
            expect(findDefaultConfigPath(dir)).toBe(conf)
        } finally {
            await fs.rm(dir, { recursive: true, force: true })
        }
    })

    it('returns undefined when no wdio config exists', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-cfg-'))
        try {
            expect(findDefaultConfigPath(dir)).toBeUndefined()
        } finally {
            await fs.rm(dir, { recursive: true, force: true })
        }
    })
})

describe('quick start (init → repl config discovery)', () => {
    it('loadDeepAgentConfig() with no flags resolves the model from the config init writes', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-quickstart-'))
        try {
            // what `wdio-deepagent init` writes to the project root
            await fs.writeFile(
                path.join(dir, 'wdio.conf.ts'),
                renderWdioConfig(parseInitAnswers({ framework: 'mocha' })),
            )

            const cfg = await loadDeepAgentConfig({ env: {}, cwd: dir })
            expect(cfg.model).toMatchObject({ provider: 'openrouter', model: 'moonshotai/kimi-k3' })
            expect(cfg.heal).toBe('ask')
        } finally {
            await fs.rm(dir, { recursive: true, force: true })
        }
    })
})
