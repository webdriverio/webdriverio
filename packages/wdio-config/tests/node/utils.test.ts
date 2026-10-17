import url from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

import { describe, it, expect, vi, afterEach } from 'vitest'

import { makeRelativeToCWD } from '../../src/node/utils.js'
import FileSystemPathService from '../../src/node/FileSystemPathService.js'

const cwd = path.resolve('/', 'project', 'root')

describe('makeRelativeToCWD', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('resolves a file with a directory from the current working directory', () => {
        vi.spyOn(process, 'cwd').mockReturnValue(cwd)
        expect(makeRelativeToCWD(['./specs/login.spec.js', '../other/login.spec.js'])).toEqual([
            path.resolve(cwd, 'specs', 'login.spec.js'),
            path.resolve(cwd, '..', 'other', 'login.spec.js')
        ])
    })

    it('resolves a glob pattern with a directory from the current working directory (#14447)', () => {
        vi.spyOn(process, 'cwd').mockReturnValue(cwd)
        expect(makeRelativeToCWD(['./specs/*.spec.js', '../other/**/*.spec.js'])).toEqual([
            path.resolve(cwd, 'specs', '*.spec.js'),
            path.resolve(cwd, '..', 'other', '**', '*.spec.js')
        ])
    })

    it('quotes literal CWD glob characters even when the target is in a parent directory', () => {
        const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-[app]-'))
        const configDir = path.join(workspace, 'config')
        const specsDir = path.join(workspace, 'specs')
        const spec = path.join(specsDir, 'login.spec.js')
        try {
            fs.mkdirSync(configDir)
            fs.mkdirSync(specsDir)
            fs.writeFileSync(spec, '')
            vi.spyOn(process, 'cwd').mockReturnValue(configDir)
            const [pattern] = makeRelativeToCWD(['../specs/*.spec.js']) as string[]
            // getFilePaths normalizes separators before it delegates to glob().
            const files = new FileSystemPathService().glob(pattern.replace(/\\/g, '/'), configDir)
            expect(files.map(filename => path.resolve(filename))).toContain(spec)
        } finally {
            fs.rmSync(workspace, { recursive: true, force: true })
        }
    })

    it('resolves native Windows backslash globs from CWD (on Windows)', () => {
        vi.spyOn(process, 'cwd').mockReturnValue(cwd)
        const nativeSpec = ['.', 'specs', '**', '*.spec.js'].join(path.sep)
        expect(makeRelativeToCWD([nativeSpec])).toEqual([
            path.resolve(cwd, 'specs', '**', '*.spec.js')
        ])
    })

    it('resolves same-drive Windows drive-relative spec globs without duplicating the drive', () => {
        if (path.sep !== '\\') {
            return // Windows-native path parsing only
        }
        const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-[drive]-'))
        const specsDir = path.join(workspace, 'specs')
        const spec = path.join(specsDir, 'login.spec.js')
        try {
            fs.mkdirSync(specsDir)
            fs.writeFileSync(spec, '')
            vi.spyOn(process, 'cwd').mockReturnValue(workspace)

            // C:specs\*.spec.js resolves relative to CWD on drive C, not a
            // directory named "C:specs". Literal [drive] in CWD stays escaped.
            const drive = path.parse(workspace).root.slice(0, 2)
            const [pattern] = makeRelativeToCWD([drive + 'specs\\*.spec.js']) as string[]
            expect(pattern).not.toContain(drive + 'specs')
            const matches = new FileSystemPathService().glob(pattern.replace(/\\/g, '/'), workspace)
            expect(matches.map(filename => path.resolve(filename))).toContain(spec)
        } finally {
            fs.rmSync(workspace, { recursive: true, force: true })
        }
    })

    it('preserves user-authored bracket glob classes after traversing out of CWD', () => {
        const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-user-glob-'))
        const bracketCwd = path.join(workspace, '[app]')
        try {
            for (const dir of ['[app]', 'a', 'p']) {
                fs.mkdirSync(path.join(workspace, dir))
            }
            for (const dir of ['a', 'p']) {
                fs.writeFileSync(path.join(workspace, dir, 'target.spec.js'), '')
            }
            vi.spyOn(process, 'cwd').mockReturnValue(bracketCwd)
            const [pattern] = makeRelativeToCWD(['../[app]/*.spec.js']) as string[]
            // Brackets supplied by the user still act as a glob class.
            expect(pattern).toBe(path.join(workspace, '[app]', '*.spec.js'))
            const files = new FileSystemPathService().glob(pattern.replace(/\\/g, '/'), bracketCwd)
            expect(files.map(file => path.resolve(file)).sort()).toEqual(
                ['a', 'p'].map(dir => path.join(workspace, dir, 'target.spec.js')).sort()
            )
        } finally {
            fs.rmSync(workspace, { recursive: true, force: true })
        }
    })

    it('keeps a value without a directory, as it matches spec files by name', () => {
        vi.spyOn(process, 'cwd').mockReturnValue(cwd)
        expect(makeRelativeToCWD(['login', 'login.spec.js', '*.spec.js'])).toEqual(['login', 'login.spec.js', '*.spec.js'])
    })

    it('turns a file URL into a path', () => {
        const file = path.resolve(cwd, 'specs', 'login.spec.js')
        expect(makeRelativeToCWD([url.pathToFileURL(file).href])).toEqual([file])
    })

    it('resolves the values of a group', () => {
        vi.spyOn(process, 'cwd').mockReturnValue(cwd)
        expect(makeRelativeToCWD([['./specs/*.spec.js', 'login']])).toEqual([
            [path.resolve(cwd, 'specs', '*.spec.js'), 'login']
        ])
    })
})
