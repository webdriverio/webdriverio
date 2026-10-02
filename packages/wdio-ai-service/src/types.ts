import type { BaseChatModel } from '@langchain/core/language_models/chat_models'

export type Provider = 'anthropic' | 'openai' | 'openrouter' | 'ollama' | 'llama-cpp' | 'lm-studio'

/**
 * Bring your own model: provider, model id and optional endpoint.
 */
export interface ModelConfig {
    provider: Provider
    model: string
    /**
     * OpenAI-compatible endpoint, Ollama server or Anthropic proxy
     */
    baseURL?: string
    /**
     * falls back to the provider's environment variable, e.g. `ANTHROPIC_API_KEY`
     */
    apiKey?: string
    /**
     * default `0`
     */
    temperature?: number
    /**
     * default `4096`
     */
    maxTokens?: number
}

/**
 * `'provider:model'`, a model config, or any LangChain chat model instance
 */
export type ModelOption = string | ModelConfig | BaseChatModel

/**
 * - `write`: replay cached steps, record misses and heals into the cache files
 * - `heal`: replay, record misses and heals with the model, write them to `outputDir` only
 * - `locked`: replay only, never call the model
 * - `off`: always call the model, never read or write the cache
 * - `auto`: `heal` when `process.env.CI` is set, `write` otherwise
 */
export type CacheMode = 'auto' | 'write' | 'heal' | 'locked' | 'off'

export interface AiServiceOptions {
    /**
     * model used when a step is not cached or has to be re-planned
     * (default `process.env.WDIO_AI_MODEL`)
     */
    model?: ModelOption
    /**
     * cache behavior (default `auto`)
     */
    cache?: CacheMode
    /**
     * where cache files live (default `<spec dir>/__act__/`)
     */
    cacheDir?: string | ((specPath: string) => string)
    /**
     * Markdown file with project conventions, appended to the system prompt
     */
    instructions?: string
    /**
     * tool calls one `act` may make (default 15)
     */
    maxSteps?: number
    /**
     * model calls per worker, `act` behaves as `locked` once they are used up
     */
    maxModelCalls?: number
    /**
     * actions the model may use (default: the page actions of `@wdio/session`)
     */
    actions?: string[]
    /**
     * the read-only evidence folder the model can look into
     */
    workspace?: {
        /**
         * root of the per-test folders (default `<outputDir>/ai`)
         */
        dir?: string
        /**
         * keep a test's folder when an `act` call failed or healed (default),
         * always, or never
         */
        keep?: 'on-failure' | 'always' | 'never'
    }
}

export interface ActOptions {
    /**
     * values for `{{name}}` placeholders in the instruction. They are
     * substituted after the model call and never sent to the model or written
     * to the cache.
     */
    values?: Record<string, string>
    /**
     * cache key, default: test title + instruction position in the test
     */
    id?: string
    /**
     * tool calls this `act` may make
     */
    maxSteps?: number
    /**
     * overall timeout in ms (default 60000)
     */
    timeout?: number
    /**
     * cache mode for this call
     */
    cache?: CacheMode
    /**
     * model for this call
     */
    model?: ModelOption
}

/**
 * target of a recorded step: the selector that ran and what is needed to
 * find the element again
 */
export interface StepTarget {
    selector: string
    role?: string
    name?: string
    candidates: string[]
}

/**
 * one recorded step of an `act` call
 */
export interface ActStep {
    /**
     * `@wdio/session` action, e.g. `click` or `fill`
     */
    action: string
    /**
     * action arguments with `{{placeholders}}`, `target` is the selector
     */
    args: Record<string, unknown>
    /**
     * WebdriverIO code the step ran, with `{{placeholders}}`
     */
    code: string
    target?: StepTarget
}

export interface ActResult {
    /**
     * `cache`: replayed without a model, `model`: planned by the model
     */
    source: 'cache' | 'model'
    /**
     * set when a cached step had to be healed
     */
    healed?: 'cache' | 'model'
    steps: Pick<ActStep, 'action' | 'code'>[]
    /**
     * what the model reported when it finished
     */
    summary?: string
}

export interface ExtractOptions {
    /**
     * values for `{{name}}` placeholders in the instruction
     */
    values?: Record<string, string>
    /**
     * tool calls this `extract` may make
     */
    maxSteps?: number
    /**
     * overall timeout in ms (default 60000)
     */
    timeout?: number
    /**
     * model for this call
     */
    model?: ModelOption
}
