import path from 'path'
import process from 'process'
import FileSystemPathService from '../src/lib/FileSystemPathService'
import glob from 'glob'

const INDEX_PATH = path.resolve(__dirname, '..', 'src', 'index.ts')

jest.mock('glob', () => ({
    sync: jest.fn(() => 'glob result')
}))

describe('FileSystemPathService', () => {
    afterEach(() => {
        (glob.sync as jest.Mock).mockClear()
        jest.clearAllMocks()
    })

    describe('getcwd', function () {

        let oldCwd
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
            process.cwd = () => undefined
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

        it('should throw if path not given', function () {
            var svc = new FileSystemPathService()
            expect(() => svc.loadFile(undefined as any)).toThrowError('A path is required')
        })

        it('should load files', function () {
            var svc = new FileSystemPathService()
            const loaded = svc.loadFile(INDEX_PATH) as any
            expect(loaded.ConfigParser).toBeDefined()
        })

        it('should throw on non present files', function () {
            var svc = new FileSystemPathService()
            expect(() => svc.loadFile(INDEX_PATH + '.tar.gz.non-existent')).toThrowError(expect.objectContaining({ message: expect.stringContaining('Cannot find module') }))
        })
    })
})
