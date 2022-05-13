import path from 'node:path'
import process from 'node:process'
import glob from 'glob'
import { vi, MockedFunction, describe, it, expect, afterEach, beforeEach } from 'vitest'

import FileSystemPathService from '../src/lib/FileSystemPathService'

const INDEX_PATH = path.resolve(__dirname, '..', 'src', 'index.ts')

vi.mock('glob', () => ({
    default: { sync: vi.fn(() => 'glob result') }
}))

describe('FileSystemPathService', () => {
    afterEach(() => {
        (glob.sync as MockedFunction<any>).mockClear()
        vi.clearAllMocks()
    })

    describe('getcwd', function () {
        let oldCwd: () => string
        beforeEach(() => {
            oldCwd = process.cwd
        })
        afterEach(() => {
            process.cwd = oldCwd
        })

        it('should return current working directory', function () {
            var svc = new FileSystemPathService()
            expect(svc.getcwd()).toEqual(process.cwd())
        })

        it('should throw if cwd returns undefined', function () {
            process.cwd = () => undefined as any as string
            var svc = new FileSystemPathService()
            expect(() => svc.getcwd()).toThrowError('Unable to find current working directory from process')
        })
    })

    describe('isFile', function () {
        it('should return true if file esxists', function () {
            var svc = new FileSystemPathService()
            expect(svc.isFile(INDEX_PATH)).toBeTruthy()
        })

        it("should return false if file doesn't exist", function () {
            var svc = new FileSystemPathService()
            expect(svc.isFile(INDEX_PATH + '.tar.gz.non-existent')).toBeFalsy()
        })
    })

    describe('ensureAbsolutePath', function () {
        it('should return abs path given abs path', function () {
            var svc = new FileSystemPathService()
            expect(svc.ensureAbsolutePath(path.resolve(__dirname, 'absolutely')))
                .toEqual(path.resolve(__dirname, 'absolutely'))
        })

        it('should return abs path given relative path', function () {
            var svc = new FileSystemPathService()
            expect(svc.ensureAbsolutePath('all_relativity')).toEqual(path.resolve(process.cwd(), 'all_relativity'))
        })
    })

    describe('glob', function () {
        it('should pass calls to glob', function () {
            var svc = new FileSystemPathService()
            expect(svc.glob('globtrotter')).toEqual('glob result')
            expect(glob.sync).toHaveBeenCalledWith('globtrotter')
        })
    })

    describe('loadFile', function () {
        it('should throw if path not given', async function () {
            var svc = new FileSystemPathService()
            await expect(async () => await svc.loadFile(undefined as any))
                .rejects.toThrowError('A path is required')
        })

        it('should load files', async function () {
            var svc = new FileSystemPathService()
            const loaded = await svc.loadFile(INDEX_PATH) as any
            expect(loaded.ConfigParser).toBeDefined()
        })

        it('should throw on non present files', async function () {
            var svc = new FileSystemPathService()
            await expect(async () => await svc.loadFile(INDEX_PATH + '.tar.gz.non-existent'))
                .rejects
                .toThrowError(expect.objectContaining({
                    message: expect.stringContaining('Failed to load')
                }))
        })
    })
})
