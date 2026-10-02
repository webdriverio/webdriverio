import { afterEach, describe, expect, it, vi } from 'vitest'

import { describeModel, parseModelString, resolveModel, selectModel, MODEL_ENV } from '../src/model.js'
import { ScriptedChatModel } from './__fixtures__/scriptedModel.js'

describe('parseModelString', () => {
    it('splits provider and model at the first colon', () => {
        expect(parseModelString('anthropic:claude-sonnet-5-5')).toEqual({ provider: 'anthropic', model: 'claude-sonnet-5-5' })
        expect(parseModelString('ollama:qwen3:8b')).toEqual({ provider: 'ollama', model: 'qwen3:8b' })
        expect(parseModelString('openrouter:moonshotai/kimi-k3')).toEqual({ provider: 'openrouter', model: 'moonshotai/kimi-k3' })
    })

    it('rejects a string without a provider or with an unknown provider', () => {
        expect(() => parseModelString('claude-sonnet-5-5')).toThrow('Use "provider:model"')
        expect(() => parseModelString('anthropic:')).toThrow('Use "provider:model"')
        expect(() => parseModelString('acme:model')).toThrow('Unknown provider "acme"')
    })
})

describe('selectModel', () => {
    afterEach(() => {
        delete process.env[MODEL_ENV]
    })

    it('prefers the call option, then the service option, then WDIO_AI_MODEL', () => {
        process.env[MODEL_ENV] = 'ollama:from-env'
        expect(selectModel('openai:call', 'anthropic:service')).toBe('openai:call')
        expect(selectModel(undefined, 'anthropic:service')).toBe('anthropic:service')
        expect(selectModel(undefined, undefined)).toBe('ollama:from-env')
        delete process.env[MODEL_ENV]
        expect(selectModel(undefined, undefined)).toBeUndefined()
    })
})

describe('resolveModel', () => {
    it('returns a chat model instance as is', async () => {
        const model = new ScriptedChatModel([])
        await expect(resolveModel(model)).resolves.toBe(model)
    })

    it('fails with the environment variable to set when the API key is missing', async () => {
        await expect(resolveModel('anthropic:claude-sonnet-5-5', {})).rejects.toThrow('No API key for "anthropic". Set ANTHROPIC_API_KEY')
        await expect(resolveModel({ provider: 'openai', model: 'gpt-5.2' }, {})).rejects.toThrow('Set OPENAI_API_KEY')
    })

    it('requires a baseURL for local OpenAI-compatible servers', async () => {
        await expect(resolveModel('lm-studio:qwen3', {})).rejects.toThrow('set `baseURL` to your server')
    })

    it('creates the provider model with temperature 0 by default', async () => {
        const anthropic = await resolveModel('anthropic:claude-sonnet-5-5', { ANTHROPIC_API_KEY: 'sk-test' }) as unknown as { model: string, temperature: number }
        expect(anthropic.constructor.name).toBe('ChatAnthropic')
        expect(anthropic.model).toBe('claude-sonnet-5-5')
        expect(anthropic.temperature).toBe(0)

        const ollama = await resolveModel('ollama:qwen3:8b', {}) as unknown as { model: string, baseUrl: string }
        expect(ollama.constructor.name).toBe('ChatOllama')
        expect(ollama.model).toBe('qwen3:8b')
        expect(ollama.baseUrl).toBe('http://localhost:11434')
    })

    it('names the package to install when a provider package is missing', async () => {
        const importer = vi.fn(async () => {
            const error = new Error('Cannot find package \'@langchain/openrouter\'') as NodeJS.ErrnoException
            error.code = 'ERR_MODULE_NOT_FOUND'
            throw error
        })
        await expect(resolveModel('openrouter:moonshotai/kimi-k3', { OPENROUTER_API_KEY: 'key' }, importer))
            .rejects.toThrow('The "openrouter" provider needs "@langchain/openrouter". Install it with `npm install --save-dev @langchain/openrouter`.')
        expect(importer).toHaveBeenCalledWith('@langchain/openrouter')
    })
})

describe('describeModel', () => {
    it('names string, config and instance models', () => {
        expect(describeModel('anthropic:claude-sonnet-5-5')).toBe('anthropic:claude-sonnet-5-5')
        expect(describeModel({ provider: 'ollama', model: 'qwen3:8b' })).toBe('ollama:qwen3:8b')
        expect(describeModel(new ScriptedChatModel([]))).toBe('ScriptedChatModel')
    })
})
