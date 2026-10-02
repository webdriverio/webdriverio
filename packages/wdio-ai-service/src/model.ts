import type { BaseChatModel } from '@langchain/core/language_models/chat_models'

import type { ModelConfig, ModelOption, Provider } from './types.js'

interface ProviderMeta {
    package: string
    envKey?: string
    baseUrlEnvKey?: string
    /**
     * local server, no API key
     */
    keyless?: boolean
}

export const PROVIDERS: Record<Provider, ProviderMeta> = {
    anthropic: { package: '@langchain/anthropic', envKey: 'ANTHROPIC_API_KEY', baseUrlEnvKey: 'ANTHROPIC_BASE_URL' },
    openai: { package: '@langchain/openai', envKey: 'OPENAI_API_KEY', baseUrlEnvKey: 'OPENAI_BASE_URL' },
    openrouter: { package: '@langchain/openrouter', envKey: 'OPENROUTER_API_KEY' },
    ollama: { package: '@langchain/ollama', baseUrlEnvKey: 'OLLAMA_BASE_URL', keyless: true },
    'llama-cpp': { package: '@langchain/openai', keyless: true },
    'lm-studio': { package: '@langchain/openai', keyless: true }
}

export const MODEL_ENV = 'WDIO_AI_MODEL'
export const DEFAULT_TEMPERATURE = 0
export const DEFAULT_MAX_TOKENS = 4096
const OLLAMA_DEFAULT_BASE_URL = 'http://localhost:11434'

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
    if (!(provider in PROVIDERS)) {
        throw new Error(`[@wdio/ai-service] Unknown provider "${provider}". Use one of: ${Object.keys(PROVIDERS).join(', ')}.`)
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

type ProviderModule = Record<string, new (args: Record<string, unknown>) => BaseChatModel>
export type Importer = (pkg: string) => Promise<unknown>

const defaultImporter: Importer = (pkg) => import(pkg)

async function importProvider (provider: Provider, importer: Importer): Promise<ProviderModule> {
    const pkg = PROVIDERS[provider].package
    try {
        return await importer(pkg) as ProviderModule
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ERR_MODULE_NOT_FOUND') {
            throw new Error(`[@wdio/ai-service] The "${provider}" provider needs "${pkg}". Install it with \`npm install --save-dev ${pkg}\`.`)
        }
        throw err
    }
}

/**
 * Create the LangChain chat model for a model option. Provider packages are
 * optional peer dependencies and are imported only here.
 */
export async function resolveModel (option: ModelOption, env: NodeJS.ProcessEnv = process.env, importer: Importer = defaultImporter): Promise<BaseChatModel> {
    if (isChatModel(option)) {
        return option
    }
    const config = typeof option === 'string' ? parseModelString(option) : option
    const meta = PROVIDERS[config.provider]
    if (!meta) {
        throw new Error(`[@wdio/ai-service] Unknown provider "${config.provider}". Use one of: ${Object.keys(PROVIDERS).join(', ')}.`)
    }
    const apiKey = config.apiKey ?? (meta.envKey ? env[meta.envKey] : undefined)
    if (!meta.keyless && !apiKey) {
        throw new Error(`[@wdio/ai-service] No API key for "${config.provider}". Set ${meta.envKey} or pass \`apiKey\` in the model config.`)
    }
    const baseURL = config.baseURL ?? (meta.baseUrlEnvKey ? env[meta.baseUrlEnvKey] : undefined)
    if ((config.provider === 'llama-cpp' || config.provider === 'lm-studio') && !baseURL) {
        throw new Error(`[@wdio/ai-service] "${config.provider}" runs locally, set \`baseURL\` to your server, e.g. http://localhost:1234/v1.`)
    }
    const temperature = config.temperature ?? DEFAULT_TEMPERATURE
    const maxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS
    const module = await importProvider(config.provider, importer)

    switch (config.provider) {
    case 'anthropic':
        return new module.ChatAnthropic({ model: config.model, apiKey, temperature, maxTokens, ...(baseURL ? { anthropicApiUrl: baseURL } : {}) })
    case 'openrouter':
        return new module.ChatOpenRouter({ model: config.model, apiKey, temperature, maxTokens, ...(baseURL ? { baseURL } : {}) })
    case 'ollama':
        return new module.ChatOllama({ model: config.model, baseUrl: baseURL ?? OLLAMA_DEFAULT_BASE_URL, temperature, numPredict: maxTokens })
    case 'openai':
    case 'llama-cpp':
    case 'lm-studio':
        return new module.ChatOpenAI({
            model: config.model,
            /**
             * local OpenAI-compatible servers ignore the key, the SDK still needs one
             */
            apiKey: apiKey ?? 'local',
            temperature,
            maxTokens,
            ...(baseURL ? { configuration: { baseURL } } : {})
        })
    }
}
