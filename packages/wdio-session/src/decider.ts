import { SessionError } from './errors.js'
import type { Cmd } from './hints.js'

/**
 * One question with a closed set of answers: the labels of `options`.
 */
export interface DecisionQuestion {
    /**
     * what to decide, e.g. which element a user means
     */
    instructions: string
    /**
     * the page around the options, e.g. its title and URL
     */
    context?: string
    /**
     * answer label → what it stands for
     */
    options: Record<string, string>
}

export interface Decision {
    /**
     * the label the model chose
     */
    choice: string
    /**
     * label → probability, over the offered labels only. Missing when the
     * model returns no token probabilities: the choice is then unscored.
     */
    probabilities?: Record<string, number>
}

/**
 * A model that picks one answer of a closed set instead of writing text:
 * a small LLM read through its token probabilities, or a decision engine.
 */
export interface Decider {
    /**
     * shown in output, e.g. `qwen3.5-4b`
     */
    name: string
    decide (question: DecisionQuestion): Promise<Decision>
}

export interface OpenAIDeciderOptions {
    /**
     * base URL of an OpenAI-compatible API, e.g. `http://localhost:8080/v1`
     */
    url: string
    model: string
    apiKey?: string
    timeout?: number
    fetch?: typeof fetch
}

const DEFAULT_DECIDER_TIMEOUT = 30_000
/**
 * the most alternatives OpenAI-compatible servers return for one token
 */
const TOP_LOGPROBS = 20

const SYSTEM_PROMPT = 'You choose one option of a list. Answer with the label of the option only, nothing else.'

interface ChatCompletion {
    choices?: {
        message?: { content?: string | null }
        logprobs?: { content?: { token: string, logprob: number, top_logprobs?: { token: string, logprob: number }[] }[] | null } | null
    }[]
}

function decisionPrompt (question: DecisionQuestion) {
    return [
        ...(question.context ? [question.context] : []),
        `Options:\n${Object.entries(question.options).map(([label, text]) => `${label}. ${text}`).join('\n')}`,
        // the question goes last: a server that caches the prompt prefix reuses the page for the next question
        question.instructions,
        'Answer with one label.'
    ].join('\n\n')
}

/**
 * Probabilities of the offered labels from the alternatives of the first
 * answer token, normalized over those labels: a token that is no label
 * (" The", "<think>") does not count.
 */
function labelProbabilities (top: { token: string, logprob: number }[], labels: string[]): Record<string, number> | undefined {
    const best = new Map<string, number>()
    for (const { token, logprob } of top) {
        const label = token.trim()
        if (labels.includes(label) && logprob > (best.get(label) ?? -Infinity)) {
            best.set(label, logprob)
        }
    }
    if (!best.size) {
        return undefined
    }
    const max = Math.max(...best.values())
    let sum = 0
    for (const logprob of best.values()) {
        sum += Math.exp(logprob - max)
    }
    const probabilities: Record<string, number> = {}
    for (const label of labels) {
        probabilities[label] = best.has(label) ? Math.exp(best.get(label)! - max) / sum : 0
    }
    return probabilities
}

/**
 * A decider on an OpenAI-compatible chat completions API that returns
 * token probabilities: llama.cpp server, vLLM, and other local servers.
 * It asks for one token at temperature 0 and reads the probabilities of
 * the labels from its alternatives. Thinking is switched off, a first
 * token of `<think>` would say nothing about the labels.
 */
export function openAIDecider (opts: OpenAIDeciderOptions): Decider {
    const doFetch = opts.fetch ?? fetch
    const endpoint = `${opts.url.replace(/\/+$/, '')}/chat/completions`
    return {
        name: opts.model,
        async decide (question) {
            const labels = Object.keys(question.options)
            let response: Response
            try {
                response = await doFetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        ...(opts.apiKey ? { authorization: `Bearer ${opts.apiKey}` } : {})
                    },
                    body: JSON.stringify({
                        model: opts.model,
                        messages: [
                            { role: 'system', content: SYSTEM_PROMPT },
                            { role: 'user', content: decisionPrompt(question) }
                        ],
                        max_tokens: 1,
                        temperature: 0,
                        logprobs: true,
                        top_logprobs: TOP_LOGPROBS,
                        chat_template_kwargs: { enable_thinking: false }
                    }),
                    signal: AbortSignal.timeout(opts.timeout ?? DEFAULT_DECIDER_TIMEOUT)
                })
            } catch (err) {
                throw new SessionError('MISSING_DEPENDENCY', `The decision model at ${endpoint} did not answer: ${(err as Error).message}`, {
                    hint: 'Start the model server, or point WDIO_PICK_URL (or --url) at it.',
                    cause: err
                })
            }
            if (!response.ok) {
                const body = (await response.text().catch(() => '')).slice(0, 300)
                throw new SessionError('MISSING_DEPENDENCY', `The decision model at ${endpoint} answered ${response.status}${body ? `: ${body}` : ''}`)
            }
            const completion = await response.json() as ChatCompletion
            const choice = completion.choices?.[0]
            const first = choice?.logprobs?.content?.[0]
            const probabilities = first
                ? labelProbabilities([{ token: first.token, logprob: first.logprob }, ...(first.top_logprobs ?? [])], labels)
                : undefined
            if (probabilities) {
                const [best] = Object.entries(probabilities).sort((a, b) => b[1] - a[1])
                return { choice: best[0], probabilities }
            }
            const text = (choice?.message?.content ?? '').trim()
            const answered = labels.find((label) => text === label || text.startsWith(`${label}.`))
            if (!answered) {
                throw new SessionError('INTERNAL', `The decision model answered ${JSON.stringify(text.slice(0, 40))}, which is no option.`)
            }
            return { choice: answered }
        }
    }
}

const PICK_ENV = {
    url: 'WDIO_PICK_URL',
    model: 'WDIO_PICK_MODEL',
    apiKey: 'WDIO_PICK_API_KEY'
} as const

/**
 * The decider of a `pick`: the one an agent session was created with,
 * else an OpenAI-compatible server from `--url`/`--model` or the
 * environment the session was opened in.
 */
export function resolveDecider (configured: Decider | undefined, args: Record<string, unknown>, cmd: Cmd, env: NodeJS.ProcessEnv = process.env): Decider {
    if (configured && args.url === undefined && args.model === undefined) {
        return configured
    }
    const url = typeof args.url === 'string' ? args.url : env[PICK_ENV.url]
    const model = typeof args.model === 'string' ? args.model : env[PICK_ENV.model]
    if (!url || !model) {
        throw new SessionError('MISSING_DEPENDENCY', '`pick` needs a decision model and none is configured.', {
            hint: `Run an OpenAI-compatible server that returns token probabilities (llama.cpp, vLLM) and set ${PICK_ENV.url} and ${PICK_ENV.model} before \`${cmd('open', undefined, 'wdio session open')}\`, or pass --url and --model.`
        })
    }
    return openAIDecider({ url, model, apiKey: env[PICK_ENV.apiKey] })
}
