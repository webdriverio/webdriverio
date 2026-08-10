import { z } from 'zod'

/**
 * Signature of the `request` override: a plain prompt→text function with
 * no HTTP code required. Mirrors wdio-agent-service's `request`.
 */
export interface RequestOverrideFn {
    (input: { system?: string; user?: string }): Promise<string> | string
}

/**
 * BYOK model configuration — one schema for every supported provider.
 *
 * Mirrors the wdio-agent-service pattern (schema + optional `request`
 * override) without any per-provider HTTP code: the resolver maps this
 * schema onto the matching LangChain chat model integration.
 */
export const DeepAgentModelConfigSchema = z.object({
    /**
     * LLM provider. `openrouter` covers dozens of models with one key;
     * `openai` also covers OpenAI-compatible endpoints (LM Studio, …) via
     * `baseURL`; `ollama` runs fully local.
     */
    provider: z.enum(['openrouter', 'openai', 'anthropic', 'ollama']),
    /** Model identifier, e.g. `moonshotai/kimi-k3` or `gpt-5.5`. */
    model: z.string().min(1),
    /** Override endpoint. OpenAI-compatible base URL or Ollama server. */
    baseURL: z.string().url().optional(),
    /** API key; falls back to the provider's env var when omitted. */
    apiKey: z.string().optional(),
    temperature: z.number().min(0).max(2).default(0.1),
    maxTokens: z.number().int().positive().default(8192),
    /**
     * Escape hatch: fully custom LLM request, e.g.
     * `async ({ system, user }) => string`. Takes priority over provider
     * settings (which are still validated). Text-only — no tool calling.
     */
    request: z.custom<RequestOverrideFn>((v) => typeof v === 'function').optional(),
})

export type DeepAgentModelConfig = z.infer<typeof DeepAgentModelConfigSchema>
export type DeepAgentProvider = z.infer<typeof DeepAgentModelConfigSchema>['provider']

/** Normalizes a plain config object: applies defaults, validates fields. */
export function parseModelConfig(raw: unknown): DeepAgentModelConfig {
    return DeepAgentModelConfigSchema.parse(raw)
}
