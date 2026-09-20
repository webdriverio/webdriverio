/**
 * Print a path + title index of contributor-relevant docs.
 * Used by agents via `pnpm run docs:list`.
 */
import fs from 'node:fs'
import path from 'node:path'
import type { DocEntry, PackageManifest } from './types.js'
import { isMainModule, toPosix, workspaceRoot } from './workspace.js'

const SKIP_DIRS: ReadonlySet<string> = new Set([
    'node_modules',
    'build',
    'coverage',
    'cjs',
    '.git'
])

const ROOT_DOCS: ReadonlyArray<readonly [string, string]> = [
    ['AGENTS.md', 'start here as an agent'],
    ['CONTRIBUTING.md', 'human contributor guide'],
    ['README.md', 'project overview + package list'],
    ['ROADMAP.md', 'product direction'],
    ['GOVERNANCE.md', 'roles and review rules'],
    ['.github/OWNERSHIP.md', 'package ownership map']
]

function rel (abs: string): string {
    return toPosix(path.relative(workspaceRoot, abs))
}

export function firstHeadingOrFrontmatterTitle (contents: string, fallback: string): string {
    const fm = contents.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    if (fm) {
        const title = fm[1].match(/^title:\s*(?:"([^"]+)"|'([^']+)'|(.+))$/m)
        if (title) {
            return (title[1] || title[2] || title[3] || fallback).trim()
        }
    }
    const heading = contents.match(/^#\s+(.+)$/m)
    return heading ? heading[1].trim() : fallback
}

export function walkFiles (
    dir: string,
    predicate: (name: string, abs: string) => boolean,
    out: string[] = []
): string[] {
    if (!fs.existsSync(dir)) {
        return out
    }
    for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, dirent.name)
        if (dirent.isDirectory()) {
            if (
                SKIP_DIRS.has(dirent.name) ||
                (dirent.name.startsWith('.') && dirent.name !== '.agents' && dirent.name !== '.github')
            ) {
                continue
            }
            walkFiles(abs, predicate, out)
            continue
        }
        if (predicate(dirent.name, abs)) {
            out.push(abs)
        }
    }
    return out
}

function addEntry (entries: DocEntry[], file: string, hint?: string, title?: string): void {
    const abs = path.isAbsolute(file) ? file : path.join(workspaceRoot, file)
    if (!fs.existsSync(abs)) {
        return
    }
    const contents = fs.readFileSync(abs, 'utf8')
    entries.push({
        file: rel(abs),
        title: title || firstHeadingOrFrontmatterTitle(contents, path.basename(abs)),
        hint
    })
}

export function collectDocEntries (): DocEntry[] {
    const entries: DocEntry[] = []

    for (const [file, hint] of ROOT_DOCS) {
        addEntry(entries, file, hint)
    }

    for (const abs of walkFiles(path.join(workspaceRoot, 'website', 'docs'), (name) => {
        return (name.endsWith('.md') || name.endsWith('.mdx')) && !name.startsWith('_')
    })) {
        addEntry(entries, abs, 'user guide (hand-written)')
    }

    const packagesRoot = path.join(workspaceRoot, 'packages')
    if (fs.existsSync(packagesRoot)) {
        for (const dirent of fs.readdirSync(packagesRoot, { withFileTypes: true })) {
            if (!dirent.isDirectory()) {
                continue
            }
            const readme = path.join(packagesRoot, dirent.name, 'README.md')
            const pkgJsonPath = path.join(packagesRoot, dirent.name, 'package.json')
            if (!fs.existsSync(readme) || !fs.existsSync(pkgJsonPath)) {
                continue
            }
            const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')) as PackageManifest
            addEntry(entries, readme, pkg.name, pkg.description || pkg.name || dirent.name)
        }
    }

    for (const abs of walkFiles(workspaceRoot, (name, filePath) => {
        const relative = rel(filePath)
        if (relative.startsWith('website/') && name !== 'AGENTS.md') {
            return false
        }
        return name === 'AGENTS.md' || name === 'SKILL.md'
    })) {
        addEntry(entries, abs, 'agent guide')
    }

    const seen = new Set<string>()
    return entries.filter((entry) => {
        if (seen.has(entry.file)) {
            return false
        }
        seen.add(entry.file)
        return true
    })
}

export function formatDocIndex (entries: readonly DocEntry[]): string {
    const lines = entries.map((entry) => {
        const hint = entry.hint ? `  (${entry.hint})` : ''
        return `${entry.file} — ${entry.title}${hint}`
    })
    lines.push('')
    lines.push(`${entries.length} docs. Match the task to a path before editing. Generated API pages are not listed; edit JSDoc or protocol specs instead.`)
    return lines.join('\n')
}

function main (): void {
    console.log(formatDocIndex(collectDocEntries()))
}

if (isMainModule(import.meta.url)) {
    main()
}
