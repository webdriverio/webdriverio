import { describe, expect, it } from 'vitest'
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import {
    OLLAMA_DEFAULT_BASE_URL,
    RequestChatModel,
    parseModelConfig,
    resolveChatModel,
} from '../src/model/index.js'

describe('parseModelConfig (zod schema)', () => {
    it('validates a minimal provider config and applies defaults', () => {
        const cfg = parseModelConfig({ provider: 'openrouter', model: 'moonshotai/kimi-k3' })
        expect(cfg.temperature).toBe(0.1)
        expect(cfg.maxTokens).toBe(8192)
        expect(cfg.apiKey).toBeUndefined()
    })

    it('rejects unknown providers', () => {
        expect(() => parseModelConfig({ provider: 'gemini', model: 'x' })).toThrow()
    })

    it('rejects empty model names', () => {
        expect(() => parseModelConfig({ provider: 'openai', model: '' })).toThrow()
    })

    it('rejects invalid base URLs', () => {
        expect(() => parseModelConfig({ provider: 'ollama', model: 'llama3', baseURL: 'not-a-url' })).toThrow()
    })

    it('accepts a request override alongside provider fields', () => {
        const cfg = parseModelConfig({ provider: 'openai', model: 'x', request: async () => 'hi' })
        expect(typeof cfg.request).toBe('function')
    })
})

describe('resolveChatModel', () => {
    it('returns a RequestChatModel when request override is set (wins over provider)', () => {
        const model = resolveChatModel({
            provider: 'openai',
            model: 'ignored',
            request: async ({ user }) => `echo: ${user}`,
        })
        expect(model).toBeInstanceOf(RequestChatModel)
    })

    it('throws a BYOK error when a provider key is missing from config and env', () => {
        expect(() => resolveChatModel({ provider: 'openrouter', model: 'x' }, { env: {} }))
            .toThrow(/OPENROUTER_API_KEY/)
    })

    it('reads the apiKey from env when not in config', () => {
        const model = resolveChatModel(
            { provider: 'openai', model: 'gpt-5.5' },
            { env: { OPENAI_API_KEY: 'sk-test' } },
        )
        expect(model).toBeInstanceOf(Object)
        expect((model as { apiKey?: string }).apiKey).toBe('sk-test')
    })

    it('prefers config apiKey over env', () => {
        const model = resolveChatModel(
            { provider: 'anthropic', model: 'claude-sonnet-4-6', apiKey: 'cfg-key' },
            { env: { ANTHROPIC_API_KEY: 'env-key' } },
        )
        expect((model as { apiKey?: string }).apiKey).toBe('cfg-key')
    })

    it('passes baseURL to anthropic models as anthropicApiUrl', () => {
        const model = resolveChatModel(
            {
                provider: 'anthropic',
                model: 'deepseek-v4-flash',
                apiKey: 'cfg-key',
                baseURL: 'https://api.deepseek.com/anthropic',
            },
            { env: {} },
        )
        // ChatAnthropic ignores `baseURL` — without this the request silently
        // goes to api.anthropic.com with a third-party key (401 invalid x-api-key)
        expect((model as { apiUrl?: string }).apiUrl).toBe('https://api.deepseek.com/anthropic')
    })

    it('does not require a key for ollama', () => {
        const model = resolveChatModel({ provider: 'ollama', model: 'llama3.1:8b' }, { env: {} })
        expect(model).toBeDefined()
        expect((model as { baseUrl?: string }).baseUrl).toBe(OLLAMA_DEFAULT_BASE_URL)
    })

    it('honors baseURL override for ollama', () => {
        const model = resolveChatModel(
            { provider: 'ollama', model: 'llama3.1:8b', baseURL: 'http://127.0.0.1:11434' },
            { env: {} },
        )
        expect((model as { baseUrl?: string }).baseUrl).toBe('http://127.0.0.1:11434')
    })
})

describe('RequestChatModel', () => {
    it('generates a reply from the override function (system + user)', async () => {
        const model = new RequestChatModel(async ({ system, user }) => `[${system}] ${user}`)
        const res = await model.invoke([
            new SystemMessage('be terse'),
            new HumanMessage('hello'),
        ])
        expect(res.content).toBe('[be terse] hello')
    })

    it('throws on bindTools (text-only override)', () => {
        const model = new RequestChatModel(async () => 'x')
        expect(() => model.bindTools([{ name: 't' } as never])).toThrow(/does not support tool calling/)
    })

    it('handles missing user message gracefully', async () => {
        const model = new RequestChatModel(async ({ user }) => `got ${user}`)
        const res = await model.invoke([new AIMessage('assistant msg')])
        expect(res.content).toBe('got undefined')
    })
})
