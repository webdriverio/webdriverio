#!/usr/bin/env node
/**
 * Print named smoke suites from tests/smoke.runner.js without launching WDIO.
 * Usage: pnpm run test:smoke:list
 */
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const runner = path.join(root, 'tests', 'smoke.runner.js')

export function listSmokeSuites (source) {
    const block = source.match(/const smokeTests = \[([\s\S]*?)\]\s*\n/)
    if (!block) {
        throw new Error('Could not find `const smokeTests = [` in tests/smoke.runner.js')
    }
    return [...block[1].matchAll(/^\s*([A-Za-z][A-Za-z0-9]*)\s*,?\s*$/gm)].map((match) => match[1])
}

const invokedDirectly = process.argv[1] &&
    path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url)

if (invokedDirectly) {
    const names = listSmokeSuites(fs.readFileSync(runner, 'utf8'))
    for (const name of names) {
        console.log(name)
    }
    console.log(`\n${names.length} suites. Run one with: pnpm run test:smoke <name>`)
}
