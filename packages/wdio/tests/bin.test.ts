import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

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
})
