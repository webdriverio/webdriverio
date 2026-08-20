import { describe, expect, it } from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { findDefaultConfigPath, loadDeepAgentConfig, parseDeepAgentConfig } from '../src/config/index.js'
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
        expect(cfg.llm).toBeUndefined()
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
        expect(cfg.llm).toMatchObject({ provider: 'openrouter', model: 'moonshotai/kimi-k3' })
        expect(cfg.heal).toBe('propose')
    })

    it('throws a helpful hint when no model is configured', async () => {
        await expect(loadDeepAgentConfig({ env: {} })).rejects.toThrow(/wdio config/)
    })

    it('modelOptional allows a model-free config (read-only propose diagnose)', async () => {
        const cfg = await loadDeepAgentConfig({ env: {}, modelOptional: true })
        expect(cfg.llm).toBeUndefined()
        expect(cfg.heal).toBe('ask')
        expect(cfg.traceDir).toBe('test-results')
    })

    it('merges DEEPAGENT_MODEL env over the file block (preserving other model fields)', async () => {
        const cfg = await loadDeepAgentConfig({
            configPath: FIXTURE,
            env: { DEEPAGENT_MODEL: 'anthropic:claude-sonnet-4-6' },
        })
        expect(cfg.llm).toMatchObject({ provider: 'anthropic', model: 'claude-sonnet-4-6' })
    })

    it('applies the conf top-level logLevel to the logger (launcher parity)', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-loglevel-'))
        await fs.writeFile(path.join(dir, 'wdio.conf.ts'), `
            export const config = { capabilities: {}, logLevel: 'error', deepagent: {
                llm: { provider: 'lm-studio', model: 'qwen/qwen3.5-4b' },
            } }`)
        const prev = process.env.WDIO_LOG_LEVEL
        try {
            // a fresh process has no pinned level — earlier suite loads must not leak one in
            delete process.env.WDIO_LOG_LEVEL
            await loadDeepAgentConfig({ cwd: dir, env: {} })
            expect(process.env.WDIO_LOG_LEVEL).toBe('error')
        } finally {
            if (prev === undefined) {
                delete process.env.WDIO_LOG_LEVEL
            } else {
                process.env.WDIO_LOG_LEVEL = prev
            }
            await fs.rm(dir, { recursive: true, force: true })
        }
    })

    it('keeps a pinned WDIO_LOG_LEVEL when the conf has logLevels entries', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-loglevels-'))
        await fs.writeFile(path.join(dir, 'wdio.conf.ts'), `
            export const config = { capabilities: {}, logLevel: 'error', logLevels: { '@wdio/deepagent': 'info' }, deepagent: {
                llm: { provider: 'lm-studio', model: 'qwen/qwen3.5-4b' },
            } }`)
        const prev = process.env.WDIO_LOG_LEVEL
        try {
            process.env.WDIO_LOG_LEVEL = 'silent'
            await loadDeepAgentConfig({ cwd: dir, env: {} })
            expect(process.env.WDIO_LOG_LEVEL).toBe('silent')
        } finally {
            if (prev === undefined) {
                delete process.env.WDIO_LOG_LEVEL
            } else {
                process.env.WDIO_LOG_LEVEL = prev
            }
            await fs.rm(dir, { recursive: true, force: true })
        }
    })

    it('drops the file block apiKey/baseURL when the override switches provider', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-cfg-'))
        await fs.writeFile(path.join(dir, 'wdio.conf.ts'), `
            export const config = { capabilities: {}, deepagent: {
                llm: {
                    provider: 'openrouter', model: 'moonshotai/kimi-k3',
                    apiKey: 'sk-or-123', baseURL: 'https://openrouter.ai/api/v1',
                },
            } }`)
        try {
            const cfg = await loadDeepAgentConfig({ cwd: dir, env: {}, cli: { model: 'openai:gpt-5.5' } })
            expect(cfg.llm).toMatchObject({ provider: 'openai', model: 'gpt-5.5' })
            expect(cfg.llm!.apiKey).toBeUndefined()
            expect(cfg.llm!.baseURL).toBeUndefined()
        } finally {
            await fs.rm(dir, { recursive: true, force: true })
        }
    })

    it('keeps the file block apiKey/baseURL when the override keeps the provider', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-cfg-'))
        await fs.writeFile(path.join(dir, 'wdio.conf.ts'), `
            export const config = { capabilities: {}, deepagent: {
                llm: {
                    provider: 'openai', model: 'gpt-5.5',
                    apiKey: 'sk-openai', baseURL: 'https://api.openai.com/v1',
                },
            } }`)
        try {
            const cfg = await loadDeepAgentConfig({ cwd: dir, env: {}, cli: { model: 'openai:gpt-5.5-mini' } })
            expect(cfg.llm).toMatchObject({
                provider: 'openai', model: 'gpt-5.5-mini',
                apiKey: 'sk-openai', baseURL: 'https://api.openai.com/v1',
            })
        } finally {
            await fs.rm(dir, { recursive: true, force: true })
        }
    })

    it('keeps the new deepagent fields through a conf round trip', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-cfg-'))
        await fs.writeFile(path.join(dir, 'wdio.conf.ts'), `
            export const config = { capabilities: {}, deepagent: {
                llm: { provider: 'lm-studio', model: 'qwen/qwen3.5-4b' },
                instructionsPath: './AGENTS.md',
                appendInstructions: 'inline rules',
                appendInstructionsFile: './RULES.md',
                maxHealAttempts: 5,
            } }`)
        try {
            const cfg = await loadDeepAgentConfig({ cwd: dir, env: {} })
            expect(cfg.instructionsPath).toBe('./AGENTS.md')
            expect(cfg.appendInstructions).toBe('inline rules')
            expect(cfg.appendInstructionsFile).toBe('./RULES.md')
            expect(cfg.maxHealAttempts).toBe(5)
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
        expect(cfg.llm).toMatchObject({ provider: 'ollama', model: 'qwen2.5:7b' })
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
        expect(cfg.llm).toMatchObject({ provider: 'openai', model: 'gpt-5.5' })
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

describe('quick start (config wizard → repl config discovery)', () => {
    it('loadDeepAgentConfig() with no flags resolves the model from the config the wizard writes', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-quickstart-'))
        try {
            // what the wdio config wizard emits (no heal key → defaults to 'ask')
            await fs.writeFile(path.join(dir, 'wdio.conf.ts'), `
                export const config = { capabilities: {}, deepagent: {
                    llm: { provider: 'openrouter', model: 'moonshotai/kimi-k3' },
                } }`)

            const cfg = await loadDeepAgentConfig({ env: {}, cwd: dir })
            expect(cfg.llm).toMatchObject({ provider: 'openrouter', model: 'moonshotai/kimi-k3' })
            expect(cfg.heal).toBe('ask')
        } finally {
            await fs.rm(dir, { recursive: true, force: true })
        }
    })
})
