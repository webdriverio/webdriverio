/**
 * Print named smoke suites from tests/smoke.runner.js without launching WDIO.
 * Usage: pnpm run test:smoke:list
 */
import fs from 'node:fs'
import path from 'node:path'
import { isMainModule, workspaceRoot } from './workspace.js'

export const SMOKE_RUNNER_PATH: string = path.join(workspaceRoot, 'tests', 'smoke.runner.js')

export function listSmokeSuites (source: string): string[] {
    const block = source.match(/const smokeTests = \[([\s\S]*?)\]\s*\n/)
    if (!block) {
        throw new Error('Could not find `const smokeTests = [` in tests/smoke.runner.js')
    }
    return [...block[1].matchAll(/^\s*([A-Za-z][A-Za-z0-9]*)\s*,?\s*$/gm)].map((match) => match[1])
}

export function readSmokeSuites (runnerPath: string = SMOKE_RUNNER_PATH): string[] {
    return listSmokeSuites(fs.readFileSync(runnerPath, 'utf8'))
}

function main (): void {
    const names = readSmokeSuites()
    for (const name of names) {
        console.log(name)
    }
    console.log(`\n${names.length} suites. Run one with: pnpm run test:smoke <name>`)
}

if (isMainModule(import.meta.url)) {
    main()
}
