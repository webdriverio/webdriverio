import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { stripVTControlCharacters } from 'node:util'
import { test, expect } from 'vitest'

const root = fileURLToPath(new URL('../../', import.meta.url))

test('internal e2e config rejects missing inline snapshots without writing the spec', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'wdio-inline-snapshot-'))
    const spec = path.join(directory, 'missing-inline.e2e.js')
    const config = path.join(directory, 'wdio.conf.mjs')
    const source = `describe('missing inline snapshot', () => {
        it('rejects a missing snapshot', () => {
            expect('local missing inline snapshot').toMatchInlineSnapshot()
        })
    })
`
    const base = pathToFileURL(path.join(root, 'e2e/wdio/wdio.conf.ts')).href
    const env = { ...process.env }
    delete env.CI

    try {
        writeFileSync(spec, source)
        writeFileSync(config, `import { config as base } from ${JSON.stringify(base)}
            export const config = {
                ...base,
                specs: [${JSON.stringify(spec)}],
                capabilities: [{
                    browserName: 'chrome',
                    'goog:chromeOptions': { args: ['--headless', '--disable-gpu'] }
                }],
                maxInstances: 1,
                logLevel: 'error',
                outputDir: ${JSON.stringify(directory)}
            }
        `)
        const result = spawnSync(process.execPath, [
            path.join(root, 'packages/wdio-cli/bin/wdio.js'), 'run', config
        ], { cwd: path.join(root, 'e2e'), env, encoding: 'utf8', timeout: 120_000 })
        const output = stripVTControlCharacters(`${result.stdout}\n${result.stderr}`)

        expect(result.error, output).toBeUndefined()
        expect({ status: result.status, source: readFileSync(spec, 'utf8') }, output).toEqual({ status: 1, source })
        expect(output).toContain('1 snapshot(s) unmatched.')
    } finally {
        rmSync(directory, { recursive: true, force: true })
    }
})
