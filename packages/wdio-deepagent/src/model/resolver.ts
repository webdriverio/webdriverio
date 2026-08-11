import type { BaseMessage } from '@langchain/core/messages'
import { AIMessage } from '@langchain/core/messages'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { ChatResult } from '@langchain/core/outputs'
import { ChatOpenRouter } from '@langchain/openrouter'
import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { ChatOllama } from '@langchain/ollama'
import type { DeepAgentModelConfig, DeepAgentProvider, RequestOverrideFn } from './schema.js'

/**
 * Adapter that exposes a `request` override as a LangChain chat model.
 * Text-only: `bindTools` throws a clear error so the harness can tell the
 * user that tool-calling (agent modes) requires a real provider.
 */
export class RequestChatModel extends BaseChatModel {
    lc_namespace = ['wdio', 'deepagent', 'request-chat-model']
    private requestFn: RequestOverrideFn

    constructor(requestFn: RequestOverrideFn) {
        super({})
        this.requestFn = requestFn
    }

    _llmType(): string {
        return 'wdio-deepagent-request'
    }

    async _generate(messages: BaseMessage[]): Promise<ChatResult> {
        const systemMsg = messages.find((m) => m._getType() === 'system')?.content
        const userMsg = [...messages].reverse().find((m) => m._getType() === 'human' || m._getType() === 'user')?.content
        const text = await this.requestFn({
            system: typeof systemMsg === 'string' ? systemMsg : undefined,
            user: typeof userMsg === 'string' ? userMsg : undefined,
        })
        return { generations: [{ message: new AIMessage(text), text }] }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    override bindTools(): any {
        throw new Error(
            'The `request` override is text-only and does not support tool calling. ' +
            'Configure a real provider (openrouter | openai | anthropic | ollama) for agent modes.'
        )
    }
}

export const PROVIDER_ENV_KEYS: Record<DeepAgentProvider, string | undefined> = {
    openrouter: 'OPENROUTER_API_KEY',
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    ollama: undefined,
    'llama-cpp': undefined,
    'lm-studio': undefined
}

export const PROVIDER_BASE_URL_ENV_KEYS: Partial<Record<DeepAgentProvider, string>> = {
    openai: 'OPENAI_BASE_URL',
    anthropic: 'ANTHROPIC_BASE_URL',
    ollama: 'OLLAMA_BASE_URL',
}

export const OLLAMA_DEFAULT_BASE_URL = 'http://localhost:11434'

export interface ResolveModelOptions {
    /** Env to read keys/base URLs from (injectable for tests). */
    env?: NodeJS.ProcessEnv
}

/**
 * Maps a validated `DeepAgentModelConfig` to the matching LangChain chat
 * model. `request` override wins; provider keys come from config or env.
 *
 * @throws when a provider requires a key and neither config nor env has one.
 */
export function resolveChatModel(
    config: DeepAgentModelConfig,
    options: ResolveModelOptions = {},
): BaseChatModel {
    const env = options.env ?? process.env

    if (config.request) {
        return new RequestChatModel(config.request)
    }

    const envKey = PROVIDER_ENV_KEYS[config.provider]
    const apiKey = config.apiKey ?? (envKey ? env[envKey] : undefined)
    const keylessLocal = config.provider === 'llama-cpp' || config.provider === 'lm-studio'
    if (config.provider !== 'ollama' && !keylessLocal && !apiKey) {
        throw new Error(
            `[@wdio/deepagent] No API key for provider "${config.provider}". ` +
            `Set ${envKey} or add \`apiKey\` to the deepagent model config.`
        )
    }

    const common = {
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
    }
    const baseUrlEnvKey = PROVIDER_BASE_URL_ENV_KEYS[config.provider]
    const baseUrl = config.baseURL ?? (baseUrlEnvKey ? env[baseUrlEnvKey] : undefined)

    const shared = { ...common, apiKey, ...(baseUrl ? { baseURL: baseUrl } : {}) }

    switch (config.provider) {
    case 'openrouter':
        return new ChatOpenRouter(shared)
    case 'lm-studio':
    case 'llama-cpp':
    case 'openai':
        return new ChatOpenAI({
            ...common,
            // local OpenAI-compatible servers ignore auth; the SDK still
            // requires a non-empty key at request time
            apiKey: apiKey ?? (keylessLocal ? 'local' : undefined),
            configuration: {
                ...(baseUrl ? { baseURL: baseUrl } : {}),
            },
        })
    case 'anthropic':
        return new ChatAnthropic({
            ...common,
            apiKey,
            ...(baseUrl ? { anthropicApiUrl: baseUrl } : {}),
        })
    case 'ollama':
        return new ChatOllama({
            model: config.model,
            baseUrl: baseUrl ?? OLLAMA_DEFAULT_BASE_URL,
            temperature: config.temperature,
            numPredict: config.maxTokens,
        })
    }
}
