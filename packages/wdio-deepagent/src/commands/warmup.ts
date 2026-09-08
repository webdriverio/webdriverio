import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { LOCAL_PROVIDERS, type DeepAgentProvider } from '../model/schema.js'

export const WARMUP_TIMEOUT_MS = 10_000

/** Remote APIs bill ~13k tokens per repl session, so warmup is local-only. */
export function isLocalProvider(provider: DeepAgentProvider): boolean {
    return LOCAL_PROVIDERS.includes(provider)
}

/**
 * Best-effort preload of the chat model with a bare probe (no tool binding),
 * so local servers (LM Studio, Ollama) load weights before the user's first
 * real turn. Failures and slow servers are ignored — warmup must never break
 * the repl.
 */
export async function warmupModel(model: BaseChatModel, _tools: unknown[] = [], signal?: AbortSignal): Promise<void> {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
        await Promise.race([
            model.invoke('Warmup probe — reply with a single dot: ready', signal ? { signal } : undefined).then(() => undefined),
            new Promise<void>((resolve) => {
                timer = setTimeout(resolve, WARMUP_TIMEOUT_MS)
                timer.unref?.()
            }),
        ])
    } finally {
        if (timer) {
            clearTimeout(timer)
        }
    }
}
