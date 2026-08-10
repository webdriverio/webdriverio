/**
 * `wdio deepagent` — lazy entry to the @wdio/deepagent harness. The
 * heavy agent dependencies (langchain, deepagents, …) are only loaded
 * when this command actually runs. The package is an optional dependency
 * so a regular wdio-cli install stays lean.
 */
import type { Argv } from 'yargs'

export const command = 'deepagent [command]'
export const desc = 'Run the WebdriverIO DeepAgent harness (repl, run, init, diagnose, mcp)'

export const cmdArgs = {
    config: {
        desc: 'wdio.conf path (default: wdio.conf.ts in cwd)',
        type: 'string'
    },
    heal: {
        desc: 'healing policy: ask | propose | auto',
        choices: ['ask', 'propose', 'auto']
    },
    model: {
        desc: 'provider:model, e.g. openrouter:moonshotai/kimi-k3',
        type: 'string'
    },
    'trace-dir': {
        desc: 'trace artifact directory (default: test-results)',
        type: 'string'
    },
    spec: {
        desc: 'spec to reproduce (diagnose mode)',
        type: 'string'
    }
} as const

export const builder = (yargs: Argv) => {
    return yargs
        .options(cmdArgs)
        .example('$0 deepagent repl', 'Start an interactive agent session')
        .example('$0 deepagent run "fix the failing login test" --model openrouter:moonshotai/kimi-k3', 'Run a one-shot mission')
        .example('$0 deepagent diagnose trace.zip --spec ./test/specs/a.ts', 'Reproduce and heal a failing run')
        .help()
}

export async function handler(): Promise<void> {
    try {
        const { run } = await import('@wdio/deepagent')
        await run()
    } catch (err) {
        const code = (err as NodeJS.ErrnoException).code
        if (code === 'MODULE_NOT_FOUND' || code === 'ERR_MODULE_NOT_FOUND') {
            console.error('The @wdio/deepagent package is not installed.')
            console.error('Install it to use the deepagent command: npm install @wdio/deepagent')
            process.exitCode = 1
            return
        }
        throw err
    }
}
