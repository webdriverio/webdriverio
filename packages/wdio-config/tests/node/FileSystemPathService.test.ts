import url from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { sync as globSync } from 'glob'
import { vi, describe, it, expect, afterEach } from 'vitest'

import FileSystemPathService from '../../src/node/FileSystemPathService.js'

const INDEX_PATH = path.resolve(__dirname, '..', '..', 'src', 'node', 'index.ts')

vi.mock('glob', () => ({
    sync: vi.fn(() => 'glob result')
}))

vi.mock('node:path', async (origMod) => {
    const p = await origMod() as typeof path
    return {
        default: {
            ...p,
            resolve: vi.fn(p.resolve)
        }
    }
})

vi.mock('node:fs', async () => {
    return {
        default: {
            existsSync: vi.fn(), lstatSync: vi.fn(() => {
                return { isFile: () => (true) }
            })
        }
    }
})

describe('FileSystemPathService', () => {
    afterEach(() => {
        vi.mocked(globSync).mockClear()
        vi.clearAllMocks()
    })

    describe('isFile', function () {
        it('should return true if file exists', function () {
            vi.mocked(fs.existsSync).mockReturnValue(true)
            const svc = new FileSystemPathService()
            expect(svc.isFile(INDEX_PATH)).toBeTruthy()
        })

        it("should return false if file doesn't exist", function () {
            vi.mocked(fs.existsSync).mockReturnValue(false)
            const svc = new FileSystemPathService()
            expect(svc.isFile(INDEX_PATH + '.tar.gz.non-existent')).toBeFalsy()
        })
    })

    describe('ensureAbsolutePath', function () {
        it('should return abs path given abs path', function () {
            const svc = new FileSystemPathService()
            expect(svc.ensureAbsolutePath(path.resolve(__dirname, 'absolutely'), '/foo/bar'))
                .toEqual(url.pathToFileURL(path.resolve(__dirname, 'absolutely')).href)
        })

        it('should return abs path given relative path', function () {
            const svc = new FileSystemPathService()
            expect(svc.ensureAbsolutePath('all_relativity', '/foo/bar')).toBe(
                url.pathToFileURL(path.resolve('/foo/bar', 'all_relativity')).href)
        })
    })

    describe('glob', function () {
        it('should pass calls to glob', function () {
            vi.mocked(globSync).mockReturnValue(['glob result'])
            const svc = new FileSystemPathService()
            expect(svc.glob('globtrotter', '/foo/bar')).toEqual(['glob result'])
            expect(globSync).toHaveBeenCalledWith('globtrotter', { cwd: '/foo/bar', matchBase: true })
        })
        it('should process file name with []', function () {
            vi.mocked(globSync).mockReturnValue([])
            vi.mocked(fs.existsSync).mockReturnValue(true)
            const svc = new FileSystemPathService()
            expect(svc.glob('./examples/wdio/mocha/[test].js', '/foo/bar'))
                .toEqual([path.resolve('/foo', 'bar', 'examples', 'wdio', 'mocha', '[test].js')])
        })

        it('should return files in sorted order', function () {
            vi.mocked(globSync).mockReturnValue(['c.test.js', 'a.test.js', 'f.test.js'])
            vi.mocked(fs.existsSync).mockReturnValue(true)
            const svc = new FileSystemPathService()
            expect(svc.glob('./examples/wdio/mocha/*.test.js', '/foo/bar'))
                .toEqual(['a.test.js', 'c.test.js', 'f.test.js'])
        })

        it('should not return duplicated files with different upper/lower case', function () {
            vi.mocked(globSync).mockReturnValue(['D:\\data\\case-repos\\Project\\case1.spec.ts'])
            vi.mocked(fs.existsSync).mockReturnValue(true)
            vi.mocked(path.resolve).mockImplementationOnce((_, file) => file)
            const svc = new FileSystemPathService()
            expect(svc.glob('d:\\data\\case-repos\\Project\\case1.spec.ts', ''))
                .toEqual(['D:\\data\\case-repos\\Project\\case1.spec.ts'])
        })
    })

    describe('loadFile', function () {
        it('should throw if path not given', async function () {
            const svc = new FileSystemPathService()
            await expect(async () => await svc.loadFile(undefined as any))
                .rejects.toThrowError('A path is required')
        })

        it('should load files', async function () {
            const svc = new FileSystemPathService()
            const loaded = await svc.loadFile(INDEX_PATH) as any
            expect(loaded.ConfigParser).toBeDefined()
        })

        it('should throw on non present files', async function () {
            /**
             * fails in Windows
             */
            if (process.platform === 'win32') {
                return
            }
            const svc = new FileSystemPathService()
            const error = await svc.loadFile(INDEX_PATH + '.tar.gz.non-existent')
                .catch((err) => err) as Error
            expect(error.message).toContain('Failed to load url')
        })
    })
})

