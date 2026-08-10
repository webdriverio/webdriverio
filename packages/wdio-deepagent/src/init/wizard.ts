import readline from 'node:readline/promises'
import { HealModeSchema } from '../config/schema.js'
import { PROVIDERS } from '../model/schema.js'
import type { InitAnswers } from './template.js'
import { parseInitAnswers } from './template.js'

/** Injectable prompt function (tests can stub it). */
export type PromptFn = (question: string, defaultValue?: string) => Promise<string>

/** Interactive asker over readline; call `close()` to release stdin once done. */
export interface ReadlinePrompter extends PromptFn {
    close(): void
}

export function createReadlinePrompter(): ReadlinePrompter {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const prompt: PromptFn = async (question: string, defaultValue?: string) => {
        const suffix = defaultValue !== undefined ? ` (${defaultValue})` : ''
        const answer = (await rl.question(`${question}${suffix}: `)).trim()
        return answer || defaultValue || ''
    }
    return Object.assign(prompt, { close: () => rl.close() })
}

async function pick(prompt: PromptFn, question: string, options: string[], defaultValue: string): Promise<string> {
    const answer = await prompt(`${question} [${options.join('|')}]`, defaultValue)
    if (!options.includes(answer)) {
        throw new Error(`Invalid answer "${answer}" for ${question}. Expected one of: ${options.join(', ')}.`)
    }
    return answer
}

/**
 * Runs the `init` interview and returns validated answers. Everything is
 * deterministic (no LLM needed to write a correct config) — the "agent"
 * here is the guided interview, matching create-wdio's flow.
 */
export async function interview(prompt: PromptFn): Promise<InitAnswers> {
    const framework = await pick(prompt, 'Which framework do you use?', ['mocha', 'jasmine', 'cucumber'], 'mocha')
    const ts = await pick(prompt, 'Use TypeScript?', ['yes', 'no'], 'yes')
    const servicesRaw = await prompt('Services (comma-separated, e.g. appium, browserstack)?', '')
    const services = servicesRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    const cloud = await prompt('Cloud provider (browserstack, saucelabs, lambdatest, testingbot)? leave empty for local', '')
    const provider = await pick(prompt, 'LLM provider?', [...PROVIDERS], 'openrouter')
    const model = await prompt('Model?', provider === 'openrouter' ? 'moonshotai/kimi-k3' : 'gpt-5.5')
    const heal = await pick(prompt, 'Heal mode?', [...HealModeSchema.options], 'ask')

    const isUsingTypeScript = ts === 'yes'
    return parseInitAnswers({
        framework,
        isUsingTypeScript,
        services,
        cloudProvider: cloud || undefined,
        deepagentModel: { provider, model },
        heal,
    })
}
