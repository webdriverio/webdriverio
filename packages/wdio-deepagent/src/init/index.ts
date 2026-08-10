import fs from 'node:fs/promises'
import path from 'node:path'
import type { PromptFn } from './wizard.js'
import { interview } from './wizard.js'
import { renderWdioConfig } from './template.js'

export * from './template.js'
export * from './wizard.js'

export interface InitOptions {
    /** Target config file path (default wdio.conf.ts in cwd). */
    outputPath?: string
    /** Injectable prompter for tests. */
    prompt?: PromptFn
    /** Injectable writer for tests (default: fs). */
    writeFile?: (filePath: string, content: string) => Promise<void>
}

export interface InitResult {
    configPath: string
    wrote: boolean
}

/**
 * `wdio-deepagent init` — interviews the user and writes a complete,
 * framework-correct `wdio.conf.ts` (with the `deepagent` block). Refuses
 * to overwrite an existing config.
 */
export async function runInit(options: InitOptions = {}): Promise<InitResult> {
    const configPath = path.resolve(options.outputPath ?? 'wdio.conf.ts')

    try {
        await fs.access(configPath)
        throw new Error(`Refusing to overwrite existing config at ${configPath}.`)
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw err
        }
    }

    const prompt = options.prompt
    // Note: `isTTY` is undefined (not false) for piped stdin. readline's
    // sequential `question()` calls hang on non-TTY input, so any non-TTY
    // run is rejected up front rather than silently exiting.
    if (!prompt && !process.stdin.isTTY) {
        throw new Error('init requires an interactive terminal (no answers provided).')
    }
    const answers = await interview(options.prompt ?? (await import('./wizard.js')).createReadlinePrompter())
    const content = renderWdioConfig(answers)

    const writeFile = options.writeFile ?? ((filePath, content) => fs.writeFile(filePath, content, 'utf8'))
    await writeFile(configPath, content)
    return { configPath, wrote: true }
}
