import fs from 'node:fs'
import module from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src')

/**
 * Packages `@wdio/session/agent` may load. Consumers (MCP servers) install only
 * these, so heavy or CLI-only packages must stay out of its static import graph.
 */
const ALLOWED = new Set([
    'webdriverio', '@wdio/snapshot', '@wdio/utils', '@wdio/utils/node', '@wdio/logger',
    '@wdio/types', 'acorn', 'picomatch', 'image-size'
])

const STATIC_IMPORT = /(?:^|\n)\s*(?:import|export)\s+(?!type\b)(?:[^'";]*?\bfrom\s+)?['"]([^'"]+)['"]/g

function resolveRelative (from: string, specifier: string) {
    const base = path.resolve(path.dirname(from), specifier.replace(/\.js$/, ''))
    return [`${base}.ts`, path.join(base, 'index.ts')].find((file) => fs.existsSync(file))
}

function agentPackages () {
    const seen = new Set<string>()
    const packages = new Set<string>()
    const queue = [path.join(SRC, 'agent.ts')]
    while (queue.length) {
        const file = queue.pop()!
        if (seen.has(file)) {
            continue
        }
        seen.add(file)
        for (const [, specifier] of fs.readFileSync(file, 'utf-8').matchAll(STATIC_IMPORT)) {
            if (specifier.startsWith('.')) {
                const target = resolveRelative(file, specifier)
                expect(target, `${specifier} imported by ${path.relative(SRC, file)}`).toBeDefined()
                queue.push(target!)
            } else if (!specifier.startsWith('node:') && !module.isBuiltin(specifier)) {
                packages.add(specifier)
            }
        }
    }
    return [...packages].sort()
}

describe('@wdio/session/agent imports', () => {
    it('only loads packages an agent host installs', () => {
        const packages = agentPackages()
        expect(packages.filter((pkg) => !ALLOWED.has(pkg))).toEqual([])
        for (const banned of ['expect-webdriverio', 'tsx', 'yargs', 'get-port', 'semver', '@wdio/display-server', '@wdio/config']) {
            expect(packages).not.toContain(banned)
        }
    })
})
