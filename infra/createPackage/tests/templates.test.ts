import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, afterEach } from 'vitest'

import { getPackageNames, buildPackageScaffold, PACKAGE_TYPES } from '../src/templates.js'
import { createPackage } from '../src/index.js'

const tempDirs: string[] = []

afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

describe('getPackageNames', () => {
    it('builds scoped and directory names', () => {
        expect(getPackageNames('video', 'reporter')).toEqual({
            fullPackageName: 'wdio-video-reporter',
            fullScopedPackageName: '@wdio/video-reporter'
        })
    })
})

describe('buildPackageScaffold', () => {
    it('includes the files the monorepo expects', () => {
        const scaffold = buildPackageScaffold('video', 'reporter')
        expect(PACKAGE_TYPES).toContain('reporter')
        expect(scaffold.mainPackageFolderFiles.map((f) => f.name)).toEqual([
            '.npmignore',
            'tsconfig.json',
            'tsconfig.prod.json',
            'package.json',
            'README.md'
        ])
        expect(scaffold.mainPackageFolderFiles.find((f) => f.name === 'package.json')?.content)
            .toContain('"name": "@wdio/video-reporter"')
        expect(scaffold.srcPackageFolderFiles[0]).toEqual({
            name: 'index.js',
            content: 'export default {}'
        })
        expect(scaffold.testsPackageFolderFiles[0].name).toBe('example.test.ts')
    })
})

describe('createPackage', () => {
    it('writes the scaffold onto disk', () => {
        const packagesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-create-'))
        tempDirs.push(packagesDir)

        createPackage('video', 'reporter', packagesDir)

        const root = path.join(packagesDir, 'wdio-video-reporter')
        expect(fs.existsSync(path.join(root, 'package.json'))).toBe(true)
        expect(fs.existsSync(path.join(root, 'src', 'index.js'))).toBe(true)
        expect(fs.existsSync(path.join(root, 'tests', 'example.test.ts'))).toBe(true)
        expect(JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8')).name)
            .toBe('@wdio/video-reporter')
    })

    it('rejects an empty name or an existing package', () => {
        const packagesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-create-'))
        tempDirs.push(packagesDir)
        expect(() => createPackage('', 'reporter', packagesDir)).toThrow(/can not be empty/)
        createPackage('video', 'reporter', packagesDir)
        expect(() => createPackage('video', 'reporter', packagesDir)).toThrow(/already exists/)
    })
})
