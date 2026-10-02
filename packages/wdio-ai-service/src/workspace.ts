import type { Dirent } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { AgentMiddleware } from 'langchain'
import type { LogEntry, NetworkEntry } from '@wdio/session/agent'

import { redact } from './redact.js'
import type { ActStep } from './types.js'

export type KeepPolicy = 'on-failure' | 'always' | 'never'

/**
 * tool output longer than this goes to a file, the model gets its path
 */
export const MAX_INLINE_OUTPUT = 12_000

/**
 * file and folder names from free text
 */
function slug (value: string) {
    return value.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'untitled'
}

async function assertNoSymlinks (dir: string) {
    let entries: Dirent[]
    try {
        entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
        return
    }
    for (const entry of entries) {
        const full = path.join(dir, entry.name)
        if (entry.isSymbolicLink()) {
            throw new Error(`[@wdio/ai-service] The workspace contains a symbolic link (${full}). The service only writes regular files there, remove it.`)
        }
        if (entry.isDirectory()) {
            await assertNoSymlinks(full)
        }
    }
}

/**
 * The evidence folder of one test: snapshots, console and network events,
 * page source and large tool output. The service writes it, the model can
 * only read it.
 */
export class Workspace {
    readonly dir: string
    /**
     * placeholder values of the current `act` call, redacted from every file
     */
    values: Record<string, string> = {}
    /**
     * placeholder values of every earlier call of the worker: browser events
     * collected since then may contain them
     */
    secrets: [name: string, value: string][] = []
    #snapshots = 0
    #outputs = 0
    keep = false

    constructor (root: string, spec: string, test: string) {
        const worker = process.env.WDIO_WORKER_ID || '0'
        this.dir = path.join(root, slug(worker), slug(path.basename(spec)), slug(test))
    }

    #write (file: string, content: string) {
        const full = path.join(this.dir, file)
        return fs.mkdir(path.dirname(full), { recursive: true })
            .then(() => fs.writeFile(full, redact(content, [...Object.entries(this.values), ...this.secrets])))
            .then(() => `/${file}`)
    }

    async writeSnapshot (text: string) {
        return this.#write(path.join('snapshots', `${String(++this.#snapshots).padStart(3, '0')}.txt`), text)
    }

    /**
     * Keep a long tool result out of the prompt: write it to a file and
     * return a short pointer with the first lines.
     */
    async inline (tool: string, text: string) {
        if (text.length <= MAX_INLINE_OUTPUT) {
            return text
        }
        const file = await this.#write(path.join('outputs', `${String(++this.#outputs).padStart(3, '0')}-${slug(tool)}.txt`), text)
        const head = text.slice(0, 2000)
        return `${head}\n…\n[${text.length} characters, the full output is in ${file}, read it with read_file or search it with grep]`
    }

    async writeEvents (logs: LogEntry[], network: NetworkEntry[]) {
        await Promise.all([
            this.#write('console.ndjson', logs.map((entry) => JSON.stringify(entry)).join('\n')),
            this.#write('network.ndjson', network.map((entry) => JSON.stringify(entry)).join('\n'))
        ])
    }

    async writeSteps (steps: ActStep[]) {
        await this.#write('steps.json', JSON.stringify(steps, null, 2))
    }

    async writeSource (source: string, native: boolean) {
        return this.#write(native ? 'source.xml' : 'page.html', source)
    }

    /**
     * Read-only file tools from `deepagents` on this folder: `ls`,
     * `read_file`, `glob` and `grep`. Paths are confined to the folder,
     * writes are denied, and results are never moved to files behind the
     * model's back.
     */
    async middleware (): Promise<AgentMiddleware> {
        await fs.mkdir(this.dir, { recursive: true })
        /**
         * `grep` of deepagents follows symbolic links out of the root
         */
        await assertNoSymlinks(this.dir)
        const { createFilesystemMiddleware, FilesystemBackend } = await import('deepagents')
        return createFilesystemMiddleware({
            backend: new FilesystemBackend({ rootDir: this.dir, virtualMode: true }),
            tools: ['ls', 'read_file', 'glob', 'grep'],
            permissions: [{ operations: ['write'], paths: ['/**'], mode: 'deny' }],
            toolTokenLimitBeforeEvict: null,
            humanMessageTokenLimitBeforeEvict: null
        }) as unknown as AgentMiddleware
    }

    /**
     * delete the folder unless the policy or a failure or heal keeps it
     */
    async finish (policy: KeepPolicy, passed: boolean) {
        const keep = policy === 'always' || (policy === 'on-failure' && (this.keep || !passed))
        if (!keep) {
            await fs.rm(this.dir, { recursive: true, force: true })
        }
        return keep
    }
}
