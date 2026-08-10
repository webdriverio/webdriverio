import { ConfigParser } from '@wdio/config/node'
import logger from '@wdio/logger'
import fs from 'node:fs'
import path from 'node:path'
import type { DeepAgentConfig, HealMode } from './schema.js'
import { parseDeepAgentConfig } from './schema.js'

const log = logger('wdio-deepagent')

export interface CliDeepAgentFlags {
    /** --heal ask|propose|auto */
    heal?: HealMode
    /** --trace-dir <path> */
    traceDir?: string
    /** --model provider:model, e.g. openrouter:moonshotai/kimi-k3 */
    model?: string
}

export interface LoadDeepAgentConfigOptions {
    /** Path to the project's wdio.conf.{js,ts,mjs,cjs}. */
    configPath?: string
    /** Injectable env for tests. */
    env?: NodeJS.ProcessEnv
    /** CLI flags — highest precedence. */
    cli?: CliDeepAgentFlags
    /** Directory to probe for the default config when `configPath` is unset. */
    cwd?: string
    /**
     * Allow a missing model (read-only `diagnose` in `propose` mode builds
     * no agent). Default `false` — agent modes require a model.
     */
    modelOptional?: boolean
}

const DEFAULT_MODEL_HINT =
    'No model configured. Run `wdio-deepagent init` to write a wdio.conf.ts with a `deepagent.model` block, ' +
    'pass `--model provider:model`, or set `DEEPAGENT_MODEL=provider:model` (e.g. openrouter:moonshotai/kimi-k3).'
export { DEFAULT_MODEL_HINT }

/** Config file names probed in the cwd when `--config` is not passed. */
export const DEFAULT_CONFIG_FILENAMES = ['wdio.conf.ts', 'wdio.conf.js', 'wdio.conf.mjs', 'wdio.conf.cjs']

/**
 * Finds the project's wdio config in `cwd` when the user did not pass
 * `--config`. Mirrors what `wdio run` would load; returns `undefined` when
 * no config exists (the `deepagent` block is optional, so this is fine).
 */
export function findDefaultConfigPath(cwd = process.cwd()): string | undefined {
    for (const name of DEFAULT_CONFIG_FILENAMES) {
        const candidate = path.join(cwd, name)
        if (fs.existsSync(candidate)) {
            return candidate
        }
    }
    return undefined
}

/** Parses a `provider:model` string into `{ provider, model }`. */
function splitModelString(model: string): { provider: 'openrouter' | 'openai' | 'anthropic' | 'ollama'; model: string } {
    const idx = model.indexOf(':')
    if (idx === -1) {
        throw new Error(`Invalid --model "${model}". Expected "provider:model", e.g. "openrouter:moonshotai/kimi-k3".`)
    }
    return { provider: model.slice(0, idx) as never, model: model.slice(idx + 1) }
}

/**
 * Loads the project's wdio config and returns the raw `deepagent` block
 * (plus the full config for framework detection by `init`).
 */
export async function loadProjectConfig(configPath: string): Promise<{ config: WebdriverIO.Config; deepagent: unknown }> {
    const parser = new ConfigParser(configPath)
    await parser.initialize()
    const config = parser.getConfig() as WebdriverIO.Config
    return { config, deepagent: (config as unknown as Record<string, unknown>).deepagent }
}

/**
 * Resolves the effective `deepagent` config with precedence:
 * CLI flags > env vars > wdio.conf.ts `deepagent` block > defaults.
 *
 * Env vars:
 * - `DEEPAGENT_MODEL` — `provider:model` string
 * - `DEEPAGENT_HEAL` — `ask` | `propose` | `auto`
 */
export async function loadDeepAgentConfig(
    options: LoadDeepAgentConfigOptions = {},
): Promise<DeepAgentConfig> {
    const env = options.env ?? process.env
    const cwd = options.cwd ?? process.cwd()

    // 1. file block (optional, default: wdio.conf.* in cwd)
    let fileBlock: Record<string, unknown> | undefined
    const configPath = options.configPath ?? findDefaultConfigPath(cwd)
    if (configPath) {
        try {
            const { deepagent } = await loadProjectConfig(configPath)
            if (deepagent && typeof deepagent === 'object') {
                fileBlock = deepagent as Record<string, unknown>
            }
        } catch (err) {
            log.warn(`Failed to load deepagent block from ${configPath}: ${(err as Error).message}`)
        }
    }

    // 2. env overrides
    const envModel = env.DEEPAGENT_MODEL
    const envHeal = env.DEEPAGENT_HEAL

    // 3. merge, lowest → highest precedence
    const merged: Record<string, unknown> = {
        ...(fileBlock ?? {}),
        ...(envHeal ? { heal: envHeal } : {}),
        ...(envModel ? { model: { ...(fileBlock?.model as Record<string, unknown> ?? {}), ...splitModelString(envModel) } } : {}),
        ...(options.cli?.heal ? { heal: options.cli.heal } : {}),
        ...(options.cli?.traceDir ? { traceDir: options.cli.traceDir } : {}),
        ...(options.cli?.model ? { model: { ...(fileBlock?.model as Record<string, unknown> ?? {}), ...splitModelString(options.cli.model) } } : {}),
    }

    if (!merged.model) {
        if (!options.modelOptional) {
            throw new Error(DEFAULT_MODEL_HINT)
        }
        // read-only mode (propose diagnose): no agent, so no model required
    }

    return parseDeepAgentConfig(merged)
}
