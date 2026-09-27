import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PNPM_SCRIPT = /(?:^|[\\/])pnpm(?:\.cjs|\.js|\.mjs)?$/i

/**
 * Node 22 and 24 ship corepack next to the executable. Node 26 does not.
 * Windows setup puts it in `node_modules` beside `node.exe`; nvm and fnm
 * put it under `lib`. Call this only when pnpm did not launch the test.
 */
function corepackJs (): string {
    const nodeDir = dirname(process.execPath)
    const candidates = [
        resolve(nodeDir, 'node_modules', 'corepack', 'dist', 'corepack.js'),
        resolve(nodeDir, '..', 'lib', 'node_modules', 'corepack', 'dist', 'corepack.js')
    ]
    const found = candidates.find((candidate) => existsSync(candidate))
    if (!found) {
        throw new Error('Could not find corepack. Run this test with pnpm so npm_execpath points at the pnpm script.')
    }
    return found
}

/**
 * Argv after `node`. Run pnpm's JavaScript entry so a destination such as
 * `C:\Users\Ada Lovelace\AppData\Local\Temp\wdio-pack` stays one argument.
 * `npm_execpath` is pnpm's entry when pnpm launched the test, and npm's
 * entry when npm did, so ignore anything that is not pnpm.
 */
function pnpmArgv (
    args: string[],
    execpath = process.env.npm_execpath,
    resolveCorepack: () => string = corepackJs
): string[] {
    if (execpath && PNPM_SCRIPT.test(execpath)) {
        return [execpath, ...args]
    }
    return [resolveCorepack(), 'pnpm', ...args]
}

function pnpm (args: string[], cwd: string) {
    return execFileSync(process.execPath, pnpmArgv(args), { cwd, encoding: 'utf8' })
}

describe('wdio package', () => {
    const corepack = () => '/opt/corepack/dist/corepack.js'

    it('packs with pnpm when npm launched the test', () => {
        const argv = pnpmArgv(
            ['pack', '--pack-destination', 'C:\\Users\\Ada Lovelace\\AppData\\Local\\Temp\\wdio-pack'],
            '/usr/lib/node_modules/npm/bin/npm-cli.js',
            corepack
        )
        expect(argv[0]).toBe('/opt/corepack/dist/corepack.js')
        expect(argv[1]).toBe('pnpm')
        expect(argv.at(-1)).toBe('C:\\Users\\Ada Lovelace\\AppData\\Local\\Temp\\wdio-pack')
    })

    it('uses the pnpm script pnpm already put on npm_execpath', () => {
        const entry = '/home/user/.cache/node/corepack/v1/pnpm/11.27.1/bin/pnpm.mjs'
        const argv = pnpmArgv(['pack'], entry, () => {
            throw new Error('corepack should not be required when pnpm launched the test')
        })
        expect(argv[0]).toBe(entry)
    })

    it('does not execute a Windows pnpm.cmd shim', () => {
        const argv = pnpmArgv(['pack'], 'C:\\Program Files\\nodejs\\pnpm.cmd', corepack)
        expect(argv[0]).toBe('/opt/corepack/dist/corepack.js')
        expect(argv[1]).toBe('pnpm')
    })

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
