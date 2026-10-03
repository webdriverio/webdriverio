import fs from 'node:fs'
import path from 'node:path'

import type { HistoryEntry } from './types.js'

export class History {
    readonly file: string
    entries: HistoryEntry[] = []
    /** changes on every `clear()`, so state tied to recorded code can reset */
    generation = 0

    /**
     * `false` keeps the history in memory only
     */
    readonly persist: boolean

    constructor (artifactsDir: string, { keep = false, persist = true } = {}) {
        this.file = path.join(artifactsDir, 'history.json')
        this.persist = persist
        if (!persist) {
            return
        }
        if (keep) {
            try {
                this.entries = JSON.parse(fs.readFileSync(this.file, 'utf-8'))
            } catch {
                this.entries = []
            }
        } else {
            this.#write()
        }
    }

    append (entry: Omit<HistoryEntry, 'n' | 'time'>) {
        const full: HistoryEntry = {
            n: (this.entries.at(-1)?.n ?? 0) + 1,
            time: new Date().toISOString(),
            ...entry
        }
        this.entries.push(full)
        this.#write()
        return full
    }

    clear () {
        this.entries = []
        this.generation++
        this.#write()
    }

    #write () {
        if (!this.persist) {
            return
        }
        fs.mkdirSync(path.dirname(this.file), { recursive: true })
        const fd = fs.openSync(this.file, 'w', 0o600)
        try {
            fs.writeSync(fd, JSON.stringify(this.entries, null, 2))
            fs.fsyncSync(fd)
        } finally {
            fs.closeSync(fd)
        }
        if (process.platform !== 'win32') {
            fs.chmodSync(this.file, 0o600)
        }
    }

    format () {
        if (this.entries.length === 0) {
            return 'No steps recorded.'
        }
        return this.entries.map((e) => {
            const lines = e.code.split('\n')
            const pad = String(e.n).padStart(3)
            return [`${pad}  ${lines[0]}`, ...lines.slice(1).map((l) => `     ${l}`)].join('\n')
        }).join('\n')
    }
}
