import type { BaseChatModel } from '@langchain/core/language_models/chat_models'

import type { ModelConfig, ModelOption, Provider } from './types.js'

/**
 * API key variables, checked up front for a clear error. Providers not
 * listed here read their own variables when LangChain creates them.
 */
const API_KEY_ENV: Record<string, string> = {
    anthropic: 'ANTHROPIC_API_KEY',
    openai: 'OPENAI_API_KEY',
    openrouter: 'OPENROUTER_API_KEY'
}

/**
 * Providers with an OpenAI-compatible API, created as `openai` models
 * with their endpoint
 */
const OPENAI_COMPATIBLE: Record<string, { baseURL?: string, keyless?: boolean }> = {
    openrouter: { baseURL: 'https://openrouter.ai/api/v1' },
    'llama-cpp': { keyless: true },
    'lm-studio': { keyless: true }
}

/**
 * how each provider's model takes a custom endpoint
 */
function endpoint (provider: string, baseURL: string): Record<string, unknown> {
    switch (provider) {
    case 'anthropic':
        return { anthropicApiUrl: baseURL }
    case 'ollama':
        return { baseUrl: baseURL }
    default:
        return { configuration: { baseURL } }
    }
}

export const MODEL_ENV = 'WDIO_AI_MODEL'
export const DEFAULT_TEMPERATURE = 0
export const DEFAULT_MAX_TOKENS = 4096

function isChatModel (value: unknown): value is BaseChatModel {
    return Boolean(value && typeof value === 'object' && typeof (value as BaseChatModel).invoke === 'function' && typeof (value as BaseChatModel).bindTools === 'function')
}

/**
 * Turn `'provider:model'` into a model config. Only the first colon splits,
 * so `'ollama:qwen3:8b'` is provider `ollama` and model `qwen3:8b`.
 */
export function parseModelString (value: string): ModelConfig {
    const index = value.indexOf(':')
    const provider = value.slice(0, index) as Provider
    const model = value.slice(index + 1)
    if (index === -1 || !model) {
        throw new Error(`[@wdio/ai-service] Invalid model "${value}". Use "provider:model", e.g. "anthropic:claude-sonnet-5-5".`)
    }
    return { provider, model }
}

/**
 * The model option of a call, the service option or `WDIO_AI_MODEL`, in
 * that order. `undefined` when none is set.
 */
export function selectModel (...options: (ModelOption | undefined)[]): ModelOption | undefined {
    for (const option of options) {
        if (option) {
            return option
        }
    }
    return process.env[MODEL_ENV] || undefined
}

export function describeModel (option: ModelOption): string {
    if (typeof option === 'string') {
        return option
    }
    if (isChatModel(option)) {
        const named = option as unknown as { model?: string, modelName?: string }
        return `${option.getName()}${named.model || named.modelName ? `:${named.model || named.modelName}` : ''}`
    }
    return `${option.provider}:${option.model}`
}

export type InitChatModel = (model: string, fields: Record<string, unknown>) => Promise<BaseChatModel>

const defaultInit: InitChatModel = async (model, fields) => {
    const { initChatModel } = await import('langchain')
    return initChatModel(model, fields) as unknown as Promise<BaseChatModel>
}

/**
 * Create the LangChain chat model for a model option with LangChain's
 * `initChatModel`, which imports the provider package (an optional peer
 * dependency) on first use. OpenRouter and local OpenAI-compatible servers
 * are created as `openai` models with their endpoint.
 */
export async function resolveModel (option: ModelOption, env: NodeJS.ProcessEnv = process.env, init: InitChatModel = defaultInit): Promise<BaseChatModel> {
    if (isChatModel(option)) {
        return option
    }
    const config = typeof option === 'string' ? parseModelString(option) : option
    const compatible = OPENAI_COMPATIBLE[config.provider]
    const keyEnv = API_KEY_ENV[config.provider]
    const apiKey = config.apiKey ?? (keyEnv ? env[keyEnv] : undefined)
    if (keyEnv && !apiKey) {
        throw new Error(`[@wdio/ai-service] No API key for "${config.provider}". Set ${keyEnv} or pass \`apiKey\` in the model config.`)
    }
    const baseURL = config.baseURL ?? (config.provider === 'ollama' ? env.OLLAMA_BASE_URL : undefined) ?? compatible?.baseURL
    if (compatible?.keyless && !baseURL) {
        throw new Error(`[@wdio/ai-service] "${config.provider}" runs locally, set \`baseURL\` to your server, e.g. http://localhost:1234/v1.`)
    }
    const provider = compatible ? 'openai' : config.provider
    const maxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS
    return init(config.model, {
        modelProvider: provider,
        temperature: config.temperature ?? DEFAULT_TEMPERATURE,
        ...(provider === 'ollama' ? { numPredict: maxTokens } : { maxTokens }),
        /**
         * local OpenAI-compatible servers ignore the key, the SDK still needs one
         */
        ...(apiKey || compatible?.keyless ? { apiKey: apiKey ?? 'local' } : {}),
        ...(baseURL ? endpoint(provider, baseURL) : {})
    })
}
