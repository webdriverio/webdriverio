import yargs from 'yargs'
import { HealModeSchema } from '../config/schema.js'
import type { HealMode } from '../config/schema.js'

export interface CliFlags {
    config?: string
    heal?: HealMode
    model?: string
    traceDir?: string
    /** Spec to reproduce (diagnose mode). */
    spec?: string
    /** Disable the @wdio/mcp browser tool surface. */
    noMcp?: boolean
    /** Positionals: prompt (run mode) / trace.zip path (diagnose mode). */
    positionals?: string[]
}

/**
 * CLI flag parsing for `wdio-deepagent` via yargs (repo standard).
 * `parse-positional-numbers: false` keeps the prompt verbatim (no numeric
 * coercion of positional words); unknown `--flags` still throw.
 */
export function parseFlags(argv: string[]): CliFlags {
    for (const arg of argv) {
        if (arg.startsWith('--') && !['--config', '--heal', '--model', '--trace-dir', '--spec', '--no-mcp'].includes(arg.split('=')[0])) {
            throw new Error(`Unknown flag "${arg}". Supported: --config, --heal, --model, --trace-dir, --spec, --no-mcp`)
        }
    }
    const parsed = yargs(argv)
        .option('config', { type: 'string' })
        .option('heal', { type: 'string' })
        .option('model', { type: 'string' })
        .option('trace-dir', { type: 'string' })
        .option('spec', { type: 'string' })
        .option('no-mcp', { type: 'boolean' })
        .parserConfiguration({ 'parse-positional-numbers': false, 'boolean-negation': false, 'camel-case-expansion': false })
        .strictOptions(true)
        .exitProcess(false)
        .fail((msg: string | undefined, err: Error | undefined) => { throw err ?? new Error(msg) })
        .parseSync()
    const missing = ['config', 'heal', 'model', 'trace-dir', 'spec'].find((k) => (parsed as Record<string, unknown>)[k] === '')
    if (missing) {
        throw new Error(`Flag --${missing} requires a value.`)
    }
    if (parsed.heal !== undefined) {
        const heal = HealModeSchema.safeParse(parsed.heal)
        if (!heal.success) {
            throw new Error(`Invalid --heal "${parsed.heal}". Expected ask | propose | auto.`)
        }
    }
    const flags: CliFlags = {}
    if (parsed.config !== undefined) { flags.config = parsed.config as string }
    if (parsed.heal !== undefined) { flags.heal = parsed.heal as HealMode }
    if (parsed.model !== undefined) { flags.model = parsed.model as string }
    if (parsed['trace-dir'] !== undefined) { flags.traceDir = parsed['trace-dir'] as string }
    if (parsed.spec !== undefined) { flags.spec = parsed.spec as string }
    if (parsed['no-mcp']) { flags.noMcp = true }
    const positionals = (parsed._ as unknown[]).map(String)
    if (positionals.length > 0) { flags.positionals = positionals }
    return flags
}
