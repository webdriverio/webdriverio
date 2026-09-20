#!/usr/bin/env node
/**
 * Print a path + title index of contributor-relevant docs.
 * Used by agents via `pnpm run docs:list`.
 */
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')

function rel (abs) {
    return path.relative(root, abs).split(path.sep).join('/')
}

function firstHeadingOrFrontmatterTitle (contents, fallback) {
    const fm = contents.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    if (fm) {
        const title = fm[1].match(/^title:\s*(?:"([^"]+)"|'([^']+)'|(.+))$/m)
        if (title) {
            return (title[1] || title[2] || title[3]).trim()
        }
    }
    const heading = contents.match(/^#\s+(.+)$/m)
    return heading ? heading[1].trim() : fallback
}

function walkFiles (dir, predicate, out = []) {
    if (!fs.existsSync(dir)) {
        return out
    }
    for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, dirent.name)
        if (dirent.isDirectory()) {
            if (
                dirent.name === 'node_modules' ||
                dirent.name === 'build' ||
                dirent.name === 'coverage' ||
                dirent.name === 'cjs' ||
                dirent.name === '.git' ||
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

const entries = []

function add (file, hint, title) {
    const abs = path.isAbsolute(file) ? file : path.join(root, file)
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

for (const [file, hint] of [
    ['AGENTS.md', 'start here as an agent'],
    ['CONTRIBUTING.md', 'human contributor guide'],
    ['README.md', 'project overview + package list'],
    ['ROADMAP.md', 'product direction'],
    ['GOVERNANCE.md', 'roles and review rules'],
    ['.github/proposals/agent-development-velocity.md', 'why AGENTS.md exists'],
    ['.github/OWNERSHIP.md', 'package ownership map']
]) {
    add(file, hint)
}

for (const abs of walkFiles(path.join(root, 'website', 'docs'), (name) => {
    return (name.endsWith('.md') || name.endsWith('.mdx')) && !name.startsWith('_')
})) {
    add(abs, 'user guide (hand-written)')
}

for (const dirent of fs.readdirSync(path.join(root, 'packages'), { withFileTypes: true })) {
    if (!dirent.isDirectory()) {
        continue
    }
    const readme = path.join(root, 'packages', dirent.name, 'README.md')
    const pkgJsonPath = path.join(root, 'packages', dirent.name, 'package.json')
    if (!fs.existsSync(readme) || !fs.existsSync(pkgJsonPath)) {
        continue
    }
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
    add(readme, pkg.name, pkg.description || pkg.name || dirent.name)
}

for (const abs of walkFiles(root, (name, filePath) => {
    const relative = rel(filePath)
    if (relative.startsWith('website/') && name !== 'AGENTS.md') {
        return false
    }
    return name === 'AGENTS.md' || name === 'SKILL.md'
})) {
    add(abs, 'agent guide')
}

const seen = new Set()
for (const entry of entries) {
    if (seen.has(entry.file)) {
        continue
    }
    seen.add(entry.file)
    const hint = entry.hint ? `  (${entry.hint})` : ''
    console.log(`${entry.file} — ${entry.title}${hint}`)
}

console.log(`\n${seen.size} docs. Match the task to a path before editing. Generated API pages are not listed; edit JSDoc or protocol specs instead.`)
