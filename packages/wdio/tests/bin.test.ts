import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, resolve, win32 } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PNPM_SCRIPT = /(?:^|[\\/])pnpm(?:\.cjs|\.js|\.mjs)?$/i

/**
 * Node 22 and 24 ship corepack next to the executable. Node 26 does not.
 * Windows setup puts it in `node_modules` beside `node.exe`; nvm and fnm
 * put it under `lib`. Call this only when pnpm did not launch the test.
 */
function corepackJs (
    nodeDir = dirname(process.execPath),
    fileExists: (candidate: string) => boolean = existsSync
): string {
    const candidates = [
        resolve(nodeDir, 'node_modules', 'corepack', 'dist', 'corepack.js'),
        resolve(nodeDir, '..', 'lib', 'node_modules', 'corepack', 'dist', 'corepack.js')
    ]
    const found = candidates.find((candidate) => fileExists(candidate))
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

/**
 * Windows tar treats `C:\...` as a remote archive on host `C` and fails with
 * `Cannot connect to C`. Read the member by filename from the archive directory.
 */
function tarballRead (archive: string, member: string, pathApi: { basename: (p: string) => string, dirname: (p: string) => string } = { basename, dirname }) {
    return {
        cwd: pathApi.dirname(archive),
        args: ['-xOf', pathApi.basename(archive), member]
    }
}

function readTarball (archive: string, member: string) {
    const read = tarballRead(archive, member)
    return execFileSync('tar', read.args, { cwd: read.cwd, encoding: 'utf8' })
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

    it('finds Corepack beside node and under an nvm lib directory', () => {
        const nodeDir = resolve('/opt/node')
        const besideNode = resolve(nodeDir, 'node_modules', 'corepack', 'dist', 'corepack.js')
        expect(corepackJs(nodeDir, (candidate) => candidate === besideNode)).toBe(besideNode)

        const nvmBin = resolve('/home/user/.nvm/versions/node/v24/bin')
        const underLib = resolve(nvmBin, '..', 'lib', 'node_modules', 'corepack', 'dist', 'corepack.js')
        expect(corepackJs(nvmBin, (candidate) => candidate === underLib)).toBe(underLib)
        expect(corepackJs(nodeDir, () => true)).toBe(besideNode)
    })

    it('fails clearly when Corepack is not installed', () => {
        expect(() => corepackJs(resolve('/opt/node-without-corepack'), () => false)).toThrow(/corepack/i)
    })

    it('gives tar a filename so a Windows drive letter is not a remote host', () => {
        const archive = 'C:\\Users\\RUNNER~1\\AppData\\Local\\Temp\\wdio-pack\\wdio-9.32.0.tgz'
        const read = tarballRead(archive, 'package/package.json', win32)
        expect(read.args).toEqual(['-xOf', 'wdio-9.32.0.tgz', 'package/package.json'])
        expect(read.cwd).toBe('C:\\Users\\RUNNER~1\\AppData\\Local\\Temp\\wdio-pack')
    })

    it('resolves the Corepack script when this Node ships one', () => {
        try {
            expect(existsSync(corepackJs())).toBe(true)
        } catch (err) {
            expect(err).toBeInstanceOf(Error)
            expect((err as Error).message).toMatch(/corepack/i)
        }
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
        const archive = resolve(dest, packed!)
        const listing = readTarball(archive, 'package/package.json')
        const published = JSON.parse(listing) as { dependencies: Record<string, string>, bin: { wdio: string } }
        expect(published.bin.wdio).toBe('./bin/wdio.js')
        expect(published.dependencies['@wdio/cli']).toMatch(/^\d+\.\d+\.\d+/)
        const bin = readTarball(archive, 'package/bin/wdio.js')
        expect(bin).toContain("import('@wdio/cli')")
    })
})
