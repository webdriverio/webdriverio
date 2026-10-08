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
