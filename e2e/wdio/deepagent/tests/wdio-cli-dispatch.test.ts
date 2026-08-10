/**
 * Tier T4 — `wdio deepagent` alias (E2E-18..19). Prereq: @wdio/cli built
 * (`packages/wdio-cli/build/index.js` present; the esbuild bundle must have
 * `@wdio/deepagent` external for the optional-dep guard to be reachable).
 *
 * Proves the lazy registration + optional-dependency resolution of the
 * alias command: the real @wdio/deepagent package is only imported when
 * the command actually runs, and a missing optional dep produces the
 * install hint instead of a raw stack trace.
 */
import { describe, expect, it } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import {
    WDIO_CLI_BIN,
    WDIO_CLI_BUILD,
    WDIO_CLI_PKG,
    makeTempDir,
    rmrf,
    spawnProcess,
} from '../helpers.js'

/**
 * A self-contained copy of the wdio-cli bundle in a temp dir whose
 * node_modules contains every external except @wdio/deepagent — the
 * optional-dep guard must fire when the alias command runs.
 */
async function makeSandboxWithoutDeepagent(): Promise<string> {
    const dir = await makeTempDir('t4-sandbox-')
    const nm = path.join(dir, 'node_modules')
    await fs.mkdir(path.join(dir, 'build'), { recursive: true })
    await fs.mkdir(nm, { recursive: true })
    await fs.copyFile(WDIO_CLI_BUILD, path.join(dir, 'build', 'index.js'))
    // the bundle requires ../package.json for its own version
    await fs.writeFile(path.join(dir, 'package.json'), JSON.stringify({ name: 't4-sandbox', version: '0.0.0', type: 'module' }))

    const src = path.join(WDIO_CLI_PKG, 'node_modules')
    const link = async (name: string, subdir = '') => {
        const target = await fs.realpath(path.join(src, subdir, name))
        await fs.symlink(target, path.join(nm, subdir, name), 'dir')
    }
    for (const name of [
        'async-exit-hook', 'chalk', 'chokidar', 'create-wdio', 'dotenv',
        'import-meta-resolve', 'lodash.flattendeep', 'lodash.pickby',
        'lodash.union', 'webdriverio', 'yargs',
    ]) {
        await link(name)
    }
    await fs.mkdir(path.join(nm, '@wdio'), { recursive: true })
    for (const name of ['config', 'logger', 'protocols', 'utils', 'types']) {
        await link(name, '@wdio')
    }
    await fs.mkdir(path.join(nm, '@vitest'), { recursive: true })
    await link('snapshot', '@vitest')

    // bin-like entry (mirrors packages/wdio-cli/bin/wdio.js)
    await fs.writeFile(path.join(dir, 'run.mjs'), 'import(\'./build/index.js\').then((m) => m.run())\n')
    return dir
}

describe('E2E-18 wdio deepagent help (lazy registration)', () => {
    it('exits 0 and prints the deepagent usage via the alias', async () => {
        const res = await spawnProcess(process.execPath, [WDIO_CLI_BIN, 'deepagent', 'help'], {
            timeoutMs: 60_000,
        })
        expect(res.code).toBe(0)
        expect(res.timedOut).toBe(false)
        for (const cmd of ['repl', 'run', 'init', 'diagnose', 'mcp']) {
            expect(res.stdout).toContain(cmd)
        }
    })
})

describe('E2E-19 wdio deepagent with the optional dep missing', () => {
    it('exits 1 with the npm install hint (optional-dependency guard)', async () => {
        const dir = await makeSandboxWithoutDeepagent()
        try {
            const res = await spawnProcess(process.execPath, [path.join(dir, 'run.mjs'), 'deepagent', 'run', 'x'], {
                cwd: dir,
                stdin: 'ignore',
                timeoutMs: 60_000,
            })
            expect(res.code).toBe(1)
            expect(res.stderr).toContain('npm install @wdio/deepagent')
            // the guard catches the import failure instead of a stack trace
            expect(res.stderr).not.toContain('Error [ERR_MODULE_NOT_FOUND]')
        } finally {
            await rmrf(dir)
        }
    })
})
