#!/usr/bin/env node
/**
 * Consistency checks for the docs site, run after `docs:generate` and
 * `docs:build`:
 *
 * 1. every hand-written doc is listed in exactly one sidebar
 * 2. every URL of the pre-restructure site still resolves, either as a page
 *    of the build or through a redirect in `website/vercel.json`
 * 3. every link in `llms.txt` points to a file of the build
 * 4. every hand-written doc has a `description` in its frontmatter
 *
 * Usage: tsx scripts/docs-generation/checkDocs.ts [--skip-build-checks]
 */
import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'

import { getTransformedRoutes } from '@vercel/routing-utils'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const WEBSITE_DIR = path.join(__dirname, '..', '..', 'website')
const DOCS_DIR = path.join(WEBSITE_DIR, 'docs')
const BUILD_DIR = path.join(WEBSITE_DIR, 'build')

/**
 * docs that are intentionally reachable without a sidebar
 */
const UNLISTED_DOCS = new Set(['contribute', 'sponsor'])

const errors: string[] = []

function walk (dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const file = path.join(dir, entry.name)
        return entry.isDirectory() ? walk(file) : [file]
    })
}

function frontmatter (file: string) {
    const content = fs.readFileSync(file, 'utf-8')
    const match = content.match(/^---\n([\s\S]*?)\n---/)
    const fields: Record<string, string> = {}
    for (const line of (match?.[1] || '').split('\n')) {
        const [key, ...value] = line.split(':')
        if (key && value.length) {
            fields[key.trim()] = value.join(':').trim()
        }
    }
    return fields
}

function docId (file: string) {
    const rel = path.relative(DOCS_DIR, file)
    const dir = path.dirname(rel)
    const id = frontmatter(file).id || path.basename(file).replace(/\.mdx?$/, '')
    return dir === '.' ? id : `${dir}/${id}`
}

function sidebarIds (sidebars: Record<string, unknown>) {
    const ids = new Map<string, string[]>()
    const add = (id: string, sidebar: string) => ids.set(id, [...(ids.get(id) || []), sidebar])
    const visit = (node: unknown, sidebar: string) => {
        if (typeof node === 'string') {
            return add(node, sidebar)
        }
        if (Array.isArray(node)) {
            return node.forEach((n) => visit(n, sidebar))
        }
        if (node && typeof node === 'object') {
            const item = node as { type?: string, id?: string, link?: { type?: string, id?: string }, items?: unknown }
            if (item.type === 'doc' && item.id) {
                add(item.id, sidebar)
            }
            if (item.link?.type === 'doc' && item.link.id) {
                add(item.link.id, sidebar)
            }
            if (item.items) {
                visit(item.items, sidebar)
            } else if (!item.type) {
                Object.values(item).forEach((n) => visit(n, sidebar))
            }
        }
    }
    for (const [name, sidebar] of Object.entries(sidebars)) {
        visit(sidebar, name)
    }
    return ids
}

/**
 * 1. sidebar coverage
 */
const sidebarsFile = path.join(WEBSITE_DIR, 'sidebars.json')
if (!fs.existsSync(sidebarsFile)) {
    console.error('website/sidebars.json is missing, run `pnpm run docs:generate` first')
    process.exit(1)
}
const listed = sidebarIds(JSON.parse(fs.readFileSync(sidebarsFile, 'utf-8')))
const handWritten = walk(DOCS_DIR).filter((file) => (
    /\.mdx?$/.test(file) &&
    !path.basename(file).startsWith('_') &&
    /**
     * copied from CONTRIBUTING.md by `docs:generate`
     */
    path.relative(DOCS_DIR, file) !== 'Contribute.md' &&
    !path.relative(DOCS_DIR, file).startsWith(`api${path.sep}`) &&
    !/^desktop-testing\/(electron|tauri|dioxus)\//.test(path.relative(DOCS_DIR, file))
))
for (const file of handWritten) {
    const id = docId(file)
    const sidebars = listed.get(id) || listed.get(id.toLowerCase()) || []
    if (sidebars.length === 0 && !UNLISTED_DOCS.has(id)) {
        errors.push(`${path.relative(WEBSITE_DIR, file)} (id "${id}") is not listed in any sidebar, add it to website/_sidebars.json`)
    } else if (sidebars.length > 1) {
        errors.push(`${path.relative(WEBSITE_DIR, file)} (id "${id}") is listed more than once (${sidebars.join(', ')})`)
    }
    if (!frontmatter(file).description) {
        errors.push(`${path.relative(WEBSITE_DIR, file)} has no \`description\` in its frontmatter, see website/STYLEGUIDE.md`)
    }
}

if (!process.argv.includes('--skip-build-checks')) {
    if (!fs.existsSync(path.join(BUILD_DIR, 'index.html'))) {
        console.error('website/build is missing, run `pnpm run docs:build` first or pass --skip-build-checks')
        process.exit(1)
    }

    const exists = (pathname: string) => {
        const clean = decodeURIComponent(pathname).replace(/\/$/, '')
        return [
            path.join(BUILD_DIR, clean),
            path.join(BUILD_DIR, `${clean}.html`),
            path.join(BUILD_DIR, clean, 'index.html'),
        ].some((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())
    }

    /**
     * 2. URL preservation
     */
    const vercelConfig = JSON.parse(fs.readFileSync(path.join(WEBSITE_DIR, 'vercel.json'), 'utf-8'))
    const { routes, error } = getTransformedRoutes(vercelConfig)
    if (error || !routes) {
        console.error('website/vercel.json is invalid:', error)
        process.exit(1)
    }
    const redirects = routes.filter((route) => (
        'src' in route && route.status && route.status >= 300 && route.status < 400 && !route.has
    )) as { src: string, headers: Record<string, string> }[]
    const resolve = (pathname: string, hops = 0): boolean => {
        if (exists(pathname)) {
            return true
        }
        const redirect = redirects.find((route) => new RegExp(route.src).test(pathname))
        if (!redirect || hops > 5) {
            return false
        }
        const location = pathname.replace(new RegExp(redirect.src), redirect.headers.Location)
        return location.startsWith('http') || resolve(location, hops + 1)
    }
    const baseline = fs.readFileSync(path.join(WEBSITE_DIR, 'url-baseline.txt'), 'utf-8')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
    for (const pathname of baseline) {
        if (!resolve(pathname)) {
            errors.push(`${pathname} no longer resolves, add a redirect to website/vercel.json`)
        }
    }

    /**
     * 3. llms.txt links
     */
    for (const index of walk(BUILD_DIR).filter((file) => /\/llms[^/]*\.txt$/.test(file) && !file.endsWith('llms-full.txt'))) {
        const content = fs.readFileSync(index, 'utf-8')
        for (const [, link] of content.matchAll(/\]\((?:https:\/\/webdriver\.io)?(\/[^)\s]+)\)/g)) {
            if (!exists(link.split('#')[0])) {
                errors.push(`${path.relative(BUILD_DIR, index)} links to ${link} which is not part of the build`)
            }
        }
    }
}

if (errors.length) {
    console.error(`${errors.length} error(s):\n${errors.map((e) => `  - ${e}`).join('\n')}`)
    process.exit(1)
}
console.log(`Docs check passed (${handWritten.length} hand-written docs)`)
