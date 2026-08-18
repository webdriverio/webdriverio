import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { StructuredToolInterface } from '@langchain/core/tools'
import type { DeepAgentProvider } from '../model/schema.js'

export const WARMUP_TIMEOUT_MS = 10_000

/** Providers serving weights locally — remote APIs bill ~13k tokens per repl session, so warmup is local-only. */
export const LOCAL_MODEL_PROVIDERS: readonly DeepAgentProvider[] = ['ollama', 'llama-cpp', 'lm-studio']

export function isLocalProvider(provider: DeepAgentProvider): boolean {
    return LOCAL_MODEL_PROVIDERS.includes(provider)
}

interface BindableModel extends BaseChatModel {
    bindTools?: (tools: StructuredToolInterface[]) => BaseChatModel
}

/**
 * Best-effort preload of the chat model with the full tool schema bound, so
 * local servers (LM Studio, Ollama) load weights and populate their prompt
 * cache with the system+tools prefix before the user's first real turn.
 * Failures and slow servers are ignored — warmup must never break the repl.
 */
export async function warmupModel(model: BaseChatModel, tools: StructuredToolInterface[], signal?: AbortSignal): Promise<void> {
    const bound = typeof (model as BindableModel).bindTools === 'function'
        ? (model as BindableModel).bindTools!(tools)
        : model
    await Promise.race([
        bound.invoke('Warmup probe — reply with a single dot: ready', signal ? { signal } : undefined).then(() => undefined),
        new Promise<void>((resolve) => {
            const timer = setTimeout(resolve, WARMUP_TIMEOUT_MS)
            timer.unref()
        }),
    ])
}
