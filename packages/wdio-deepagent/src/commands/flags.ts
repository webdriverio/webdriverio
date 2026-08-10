/** Minimal CLI flag parsing for `wdio-deepagent` (hand-rolled, no yargs). */
import { HealModeSchema } from '../config/schema.js'
import type { HealMode } from '../config/schema.js'

export interface CliFlags {
    config?: string
    heal?: HealMode
    model?: string
    traceDir?: string
    /** Spec to reproduce (diagnose mode). */
    spec?: string
    /** Positionals: prompt (run mode) / trace.zip path (diagnose mode). */
    positionals?: string[]
}

const VALUE_FLAGS = new Set(['--config', '--heal', '--model', '--trace-dir', '--spec'])

export function parseFlags(argv: string[]): CliFlags {
    const flags: CliFlags = {}
    const positionals: string[] = []
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i]
        if (VALUE_FLAGS.has(arg)) {
            const value = argv[i + 1]
            if (value === undefined || value.startsWith('--')) {
                throw new Error(`Flag ${arg} requires a value.`)
            }
            switch (arg) {
            case '--config': flags.config = value; break
            case '--heal': {
                const heal = HealModeSchema.safeParse(value)
                if (!heal.success) {
                    throw new Error(`Invalid --heal "${value}". Expected ask | propose | auto.`)
                }
                flags.heal = heal.data
                break
            }
            case '--model': flags.model = value; break
            case '--trace-dir': flags.traceDir = value; break
            case '--spec': flags.spec = value; break
            }
            i++
        } else if (arg.startsWith('--')) {
            throw new Error(`Unknown flag "${arg}". Supported: ${[...VALUE_FLAGS].join(', ')}`)
        } else {
            positionals.push(arg)
        }
    }
    if (positionals.length > 0) {
        flags.positionals = positionals
    }
    return flags
}
