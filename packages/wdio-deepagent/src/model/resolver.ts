import type { BaseMessage } from '@langchain/core/messages'
import { AIMessage } from '@langchain/core/messages'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { ChatResult } from '@langchain/core/outputs'
import { ChatOpenRouter } from '@langchain/openrouter'
import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { ChatOllama } from '@langchain/ollama'
import { PROVIDERS, type DeepAgentModelConfig, type DeepAgentProvider, type RequestOverrideFn } from './schema.js'

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

export const PROVIDER_ENV_KEYS: Record<DeepAgentProvider, string | undefined> = Object.fromEntries(
    (Object.keys(PROVIDERS) as DeepAgentProvider[]).map((p) => [p, PROVIDERS[p].envKey]),
) as Record<DeepAgentProvider, string | undefined>

export const PROVIDER_BASE_URL_ENV_KEYS: Partial<Record<DeepAgentProvider, string>> = Object.fromEntries(
    (Object.keys(PROVIDERS) as DeepAgentProvider[])
        .filter((p) => PROVIDERS[p].baseUrlEnvKey)
        .map((p) => [p, PROVIDERS[p].baseUrlEnvKey]),
) as Partial<Record<DeepAgentProvider, string>>

export const OLLAMA_DEFAULT_BASE_URL = 'http://localhost:11434'

function baseOpts(config: DeepAgentModelConfig, extra?: { apiKey?: string; baseURL?: string }) {
    return {
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        apiKey: extra?.apiKey,
        ...(extra?.baseURL ? { baseURL: extra.baseURL } : {}),
    }
}

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

    const meta = PROVIDERS[config.provider]
    const apiKey = config.apiKey ?? (meta.envKey ? env[meta.envKey] : undefined)
    const keylessLocal = config.provider !== 'ollama' && meta.keyless === true
    if (keylessLocal && !config.baseURL) {
        throw new Error(
            `[@wdio/deepagent] Provider "${config.provider}" is keyless and local — set \`baseURL\` to your server (e.g. http://localhost:1234/v1).`
        )
    }
    if (config.provider !== 'ollama' && !keylessLocal && !apiKey) {
        throw new Error(
            `[@wdio/deepagent] No API key for provider "${config.provider}". ` +
            `Set ${meta.envKey} or add \`apiKey\` to the deepagent model config.`
        )
    }

    const baseUrl = config.baseURL ?? (meta.baseUrlEnvKey ? env[meta.baseUrlEnvKey] : undefined)

    switch (config.provider) {
    case 'openrouter':
        return new ChatOpenRouter(baseOpts(config, { apiKey, baseURL: baseUrl }))
    case 'lm-studio':
    case 'llama-cpp':
    case 'openai':
        return new ChatOpenAI({
            ...baseOpts(config, {
                // local OpenAI-compatible servers ignore auth; the SDK still
                // requires a non-empty key at request time
                apiKey: apiKey ?? (keylessLocal ? 'local' : undefined),
            }),
            configuration: {
                ...(baseUrl ? { baseURL: baseUrl } : {}),
            },
        })
    case 'anthropic':
        return new ChatAnthropic({
            ...baseOpts(config, { apiKey }),
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
