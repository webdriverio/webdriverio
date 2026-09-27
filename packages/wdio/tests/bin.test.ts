import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Run pnpm with argv, not a shell. On Windows `pnpm` is `pnpm.cmd`, and
 * `shell: true` joins the arguments into one `cmd.exe` string, so a temp
 * path such as `C:\Users\Ada Lovelace\AppData\Local\Temp\wdio-pack` splits.
 * pnpm sets `npm_execpath` to its JavaScript entry when it runs the test.
 */
function pnpm (args: string[], cwd: string) {
    const entry = process.env.npm_execpath
    if (entry && !/\.(cmd|bat|ps1)$/i.test(entry)) {
        return execFileSync(process.execPath, [entry, ...args], { cwd, encoding: 'utf8' })
    }
    if (process.platform !== 'win32') {
        return execFileSync('pnpm', args, { cwd, encoding: 'utf8' })
    }
    throw new Error('Run this test with pnpm so npm_execpath points at the pnpm script.')
}

describe('wdio package', () => {
    it('is the public unscoped CLI published with the monorepo', () => {
        const pkg = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf-8'))
        const lerna = JSON.parse(readFileSync(resolve(packageDir, '..', '..', 'lerna.json'), 'utf-8'))

        expect(pkg.name).toBe('wdio')
        expect(pkg.private).toBeUndefined()
        expect(pkg.version).toBe(lerna.version)
        expect(pkg.bin).toEqual({ wdio: './bin/wdio.js' })
        expect(pkg.dependencies['@wdio/cli']).toBe('workspace:*')
        expect(pkg.publishConfig.access).toBe('public')
        expect(pkg.exports).toBeUndefined()
        expect(pkg.main).toBeUndefined()
    })

    it('runs the WebdriverIO CLI', async () => {
        const child = spawn(process.execPath, [resolve(packageDir, 'bin', 'wdio.js'), '--help'], {
            cwd: packageDir,
            env: process.env
        })
        let stdout = ''
        let stderr = ''
        child.stdout.setEncoding('utf8')
        child.stderr.setEncoding('utf8')
        child.stdout.on('data', (chunk: string) => {
            stdout += chunk
        })
        child.stderr.on('data', (chunk: string) => {
            stderr += chunk
        })
        const [code] = await once(child, 'exit')

        expect(stderr).toBe('')
        expect(code).toBe(0)
        expect(stdout).toContain('run <configPath>')
        expect(stdout).toContain('session [action..]')
    })

    it('packs a bin that imports @wdio/cli at its published version', () => {
        const dest = mkdtempSync(resolve(tmpdir(), 'wdio-pack-'))
        const packed = pnpm(['pack', '--pack-destination', dest], packageDir).trim().split('\n').pop()
        expect(packed).toBeTruthy()
        const listing = execFileSync('tar', ['-xOf', resolve(dest, packed!), 'package/package.json'], { encoding: 'utf8' })
        const published = JSON.parse(listing) as { dependencies: Record<string, string>, bin: { wdio: string } }
        expect(published.bin.wdio).toBe('./bin/wdio.js')
        expect(published.dependencies['@wdio/cli']).toMatch(/^\d+\.\d+\.\d+/)
        const bin = execFileSync('tar', ['-xOf', resolve(dest, packed!), 'package/bin/wdio.js'], { encoding: 'utf8' })
        expect(bin).toContain("import('@wdio/cli')")
    })
})
