import url from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import glob from 'glob'
import { vi, describe, it, expect, afterEach } from 'vitest'

import FileSystemPathService from '../src/lib/FileSystemPathService.js'

const INDEX_PATH = path.resolve(__dirname, '..', 'src', 'index.ts')

vi.mock('glob', () => ({
    default: { sync: vi.fn(() => 'glob result') }
}))

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
        vi.mocked(glob.sync).mockClear()
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
            const svc = new FileSystemPathService()
            expect(svc.glob('globtrotter', '/foo/bar')).toEqual('glob result')
            expect(glob.sync).toHaveBeenCalledWith('globtrotter', { cwd: '/foo/bar' })
        })
        it('should process file name with []', function () {
            vi.mocked(glob.sync).mockReturnValue([])
            vi.mocked(fs.existsSync).mockReturnValue(true)
            const svc = new FileSystemPathService()
            expect(svc.glob('./examples/wdio/mocha/[test].js', '/foo/bar'))
                .toEqual([path.resolve('/foo', 'bar', 'examples', 'wdio', 'mocha', '[test].js')])
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
            expect(error.message).toContain('Failed to load')
        })
    })
})

