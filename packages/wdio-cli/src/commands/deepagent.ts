/**
 * `wdio deepagent` — lazy entry to the @wdio/deepagent harness. The
 * heavy agent dependencies (langchain, deepagents, …) are only loaded
 * when this command actually runs. The package is an optional dependency
 * so a regular wdio-cli install stays lean.
 */
export const command = 'deepagent [command]'
export const desc = 'Run the WebdriverIO DeepAgent harness (repl, run, init, diagnose, mcp)'

export const builder = () => {}

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
