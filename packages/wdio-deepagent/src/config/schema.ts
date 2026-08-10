import { z } from 'zod'
import { DeepAgentModelConfigSchema } from '../model/schema.js'

export const HealModeSchema = z.enum(['ask', 'propose', 'auto'])
export type HealMode = z.infer<typeof HealModeSchema>

/**
 * The `deepagent` block as it appears in `wdio.conf.ts`. The whole block
 * is optional. `model` is optional at parse time — `loadDeepAgentConfig`
 * requires it unless `modelOptional` is set (read-only `diagnose` in
 * `propose` mode needs no agent and therefore no model).
 */
export const DeepAgentConfigSchema = z.object({
    /** BYOK model config (see ../model/schema.ts). Required for agent modes. */
    model: DeepAgentModelConfigSchema.optional(),
    /**
     * Healing policy for `diagnose`:
     * - `ask` (default): agent edits specs/page objects, every write is
     *   gated by human approval (interrupt_on)
     * - `propose`: filesystem is read-only; agent emits diffs only
     * - `auto`: unattended CI healing; specs/page objects only, never config
     */
    heal: HealModeSchema.default('ask'),
    /** How to spawn the @wdio/mcp server the agent connects to. */
    mcp: z.object({
        command: z.string().default('npx'),
        args: z.array(z.string()).default(['-y', '@wdio/mcp']),
    }).prefault({}),
    /** Where devtools trace artifacts land (reproduce/diagnose). */
    traceDir: z.string().default('test-results'),
    /** Filesystem scope granted to the agent. */
    permissions: z.object({
        projectRoot: z.string().default('.'),
    }).prefault({}),
})

export type DeepAgentConfig = z.infer<typeof DeepAgentConfigSchema>

/** Validates + normalizes the config block (applies defaults). */
export function parseDeepAgentConfig(raw: unknown): DeepAgentConfig {
    return DeepAgentConfigSchema.parse(raw)
}

/**
 * Type augmentation: `WebdriverIO.Config` gains the optional `deepagent`
 * block, so `wdio.conf.ts` authors get autocompletion once they import
 * `@wdio/deepagent`. Follows the ecosystem pattern (cf. `MochaOpts`).
 */
declare global {
    namespace WebdriverIO {
        interface Config {
            deepagent?: DeepAgentConfig
        }
    }
}
