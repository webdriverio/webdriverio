import { ConfigParser } from '@wdio/config/node'
import logger from '@wdio/logger'
import fs from 'node:fs'
import path from 'node:path'
import type { CliFlags } from '../commands/flags.js'
import type { DeepAgentProvider } from '../model/schema.js'
import { DeepAgentProviderSchema } from '../model/schema.js'
import type { DeepAgentConfig } from './schema.js'
import { parseDeepAgentConfig } from './schema.js'

const log = logger('@wdio/deepagent')

export interface LoadDeepAgentConfigOptions {
    /** Path to the project's wdio.conf.{js,ts,mjs,cjs}. */
    configPath?: string
    /** Injectable env for tests. */
    env?: NodeJS.ProcessEnv
    /** CLI flags — highest precedence. */
    cli?: Pick<CliFlags, 'heal' | 'model' | 'traceDir'>
    /** Directory to probe for the default config when `configPath` is unset. */
    cwd?: string
    /**
     * Allow a missing model (read-only `diagnose` in `propose` mode builds
     * no agent). Default `false` — agent modes require a model.
     */
    modelOptional?: boolean
}

const DEFAULT_MODEL_HINT =
    'No model configured. Run `npx wdio config` and select the @wdio/deepagent plugin to write a wdio.conf.ts with a `deepagent.model` block, ' +
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
function splitModelString(model: string): { provider: DeepAgentProvider; model: string } {
    const idx = model.indexOf(':')
    if (idx === -1) {
        throw new Error(`Invalid --model "${model}". Expected "provider:model", e.g. "openrouter:moonshotai/kimi-k3".`)
    }
    return { provider: DeepAgentProviderSchema.parse(model.slice(0, idx)), model: model.slice(idx + 1) }
}

/**
 * Merges a CLI/env `provider:model` override into the file block's model
 * config. Provider-specific credentials (apiKey/baseURL) must not leak into
 * a different provider — an openrouter key on an openai call fails
 * confusingly. Provider-agnostic fields (temperature, maxTokens) survive
 * either way.
 */
function mergeModelOverride(
    fileModel: Record<string, unknown> | undefined,
    override: { provider: DeepAgentProvider; model: string },
): Record<string, unknown> {
    if (!fileModel) {
        return override
    }
    if (typeof fileModel.provider === 'string' && fileModel.provider === override.provider) {
        return { ...fileModel, ...override }
    }
    const { apiKey: _apiKey, baseURL: _baseURL, ...rest } = fileModel
    return { ...rest, ...override }
}

/**
 * Loads the project's wdio config and returns the raw `deepagent` block
 * (plus the full config for framework detection).
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
    const modelStr = options.cli?.model ?? envModel
    const merged: Record<string, unknown> = {
        ...(fileBlock ?? {}),
        ...(envHeal ? { heal: envHeal } : {}),
        ...(modelStr
            ? { model: mergeModelOverride(fileBlock?.model as Record<string, unknown> | undefined, splitModelString(modelStr)) }
            : {}),
        ...(options.cli?.heal ? { heal: options.cli.heal } : {}),
        ...(options.cli?.traceDir ? { traceDir: options.cli.traceDir } : {}),
    }

    if (!merged.model && !options.modelOptional) {
        throw new Error(DEFAULT_MODEL_HINT)
    }

    return parseDeepAgentConfig(merged)
}
