import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { checkDependencyEngines, formatBrokenEngines } from '../src/engines.js'
import { checkDependencies } from '../src/index.js'

let rootDir: string

function writePackage(directory: string, manifest: object): void {
    fs.mkdirSync(directory, { recursive: true })
    fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify(manifest))
}

function consumer(extra: object = {}): string {
    const directory = path.join(rootDir, 'packages', 'consumer')
    writePackage(directory, {
        name: 'consumer',
        engines: { node: '>=22.19.0' },
        dependencies: { dependency: '^1.0.0' },
        ...extra
    })
    return directory
}

function installed(directory: string, engines?: string): void {
    writePackage(path.join(directory, 'node_modules', 'dependency'), {
        name: 'dependency',
        version: '1.0.0',
        ...(engines ? { engines: { node: engines } } : {})
    })
}

beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-engine-check-'))
})

afterEach(() => {
    fs.rmSync(rootDir, { recursive: true, force: true })
})

describe('checkDependencyEngines', () => {
    it('rejects a production dependency that drops the declared minimum, independently of the development runtime', async () => {
        installed(consumer(), '>=24')
        expect(await checkDependencies({ rootDir, packages: ['consumer'] })).toEqual([])
        expect(checkDependencyEngines({ rootDir })).toEqual([{
            package: 'consumer',
            dependency: 'dependency',
            message: 'Requires Node.js >=24, which does not support the package minimum 22.19.0'
        }])
    })

    it('accepts a dependency that supports the declared minimum', () => {
        installed(consumer(), '^22.0.0 || >=24')
        expect(checkDependencyEngines({ rootDir })).toEqual([])
    })

    it('does not apply a published runtime floor to development-only tools', () => {
        installed(consumer({ dependencies: {}, devDependencies: { dependency: '*' } }), '>=1000')
        expect(checkDependencyEngines({ rootDir })).toEqual([])
    })

    it('follows an installed workspace production dependency', () => {
        const directory = consumer()
        const linked = path.join(rootDir, 'packages', 'linked')
        writePackage(linked, { name: 'dependency', engines: { node: '>=24' } })
        fs.mkdirSync(path.join(directory, 'node_modules'))
        fs.symlinkSync(linked, path.join(directory, 'node_modules', 'dependency'), 'junction')
        expect(checkDependencyEngines({ rootDir, packages: ['consumer'] })[0]?.dependency).toBe('dependency')
    })

    it('reports an uninstalled required dependency instead of passing an incomplete install', () => {
        consumer()
        expect(checkDependencyEngines({ rootDir })[0]?.message).toContain('not installed')
    })

    it('allows optional dependencies omitted for the current platform', () => {
        consumer({ dependencies: {}, optionalDependencies: { dependency: '*' } })
        expect(checkDependencyEngines({ rootDir })).toEqual([])
    })

    it('checks an optional dependency when it is installed', () => {
        installed(consumer({ dependencies: {}, optionalDependencies: { dependency: '*' } }), '>=24')
        expect(checkDependencyEngines({ rootDir })[0]?.dependency).toBe('dependency')
    })

    it.each([undefined, 'invalid'])('reports a missing or invalid package Node range (%s)', (node) => {
        consumer({ engines: { node } })
        expect(checkDependencyEngines({ rootDir })[0]?.message).toContain('Missing or invalid engines.node')
    })

    it('reports an invalid dependency Node range', () => {
        installed(consumer(), 'invalid')
        expect(checkDependencyEngines({ rootDir })[0]?.message).toContain('Requires Node.js invalid')
    })

    it('accepts a dependency without a declared Node restriction', () => {
        installed(consumer())
        expect(checkDependencyEngines({ rootDir })).toEqual([])
    })

    it('does not impose runtime requirements on private tooling packages', () => {
        consumer({ private: true, engines: undefined })
        expect(checkDependencyEngines({ rootDir })).toEqual([])
    })

    it('fails rather than passing malformed installed metadata', () => {
        const directory = consumer()
        installed(directory)
        fs.writeFileSync(path.join(directory, 'node_modules', 'dependency', 'package.json'), 'not JSON')
        expect(() => checkDependencyEngines({ rootDir })).toThrow(SyntaxError)
    })
})

describe('formatBrokenEngines', () => {
    it('identifies the affected package, dependency and requirement', () => {
        const message = formatBrokenEngines([{ package: 'consumer', dependency: 'dependency', message: 'Requires Node.js >=24' }])
        expect(message).toContain('consumer → dependency')
        expect(message).toContain('Requires Node.js >=24')
    })

    it('prints nothing for compatible dependencies', () => {
        expect(formatBrokenEngines([])).toBe('')
    })
})
