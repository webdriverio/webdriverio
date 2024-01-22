import PercyBinary from '../src/Percy/PercyBinary'
import childProcess from 'node:child_process'

// Mocking dependencies

jest.mock('node:fs/promises', () => ({
    access: jest.fn(),
    mkdir: jest.fn().mockResolvedValue(true),
}))
jest.mock('node:fs', () => ({
    createWriteStream: jest.fn(),
    chmod: jest.fn().mockImplementation((_, __, callback) => callback()),
}))
jest.mock('yauzl')

jest.mock('node:child_process', () => ({
    spawn: jest.fn(),
}))

beforeEach(() => {
    jest.clearAllMocks()
})

describe('PercyBinary', () => {
    describe('makePath', () => {
        it('should create a path if it does not exist', async () => {
            const percyBinary = new PercyBinary()
            const result = await percyBinary.makePath('some_path')
            expect(result).toBe(true)
        })
    })

    describe('_getAvailableDirs', () => {
        it('should _getAvailableDirs', async () => {
            const percyBinary = new PercyBinary()
            percyBinary['_orderedPaths'] = ['path1', 'path2', 'path3']
            const makePathSpy = jest.spyOn(percyBinary, 'makePath').mockReturnValue(true)

            const result = await percyBinary._getAvailableDirs()
            expect(makePathSpy).toBeCalledTimes(1)
            expect(result).toBe('path1')
        })
    })

    describe('getBinaryPath', () => {
        it('should getBinaryPath', async () => {
            const percyBinary = new PercyBinary()
            const getAvailableDirsSpy = jest.spyOn(percyBinary, '_getAvailableDirs').mockReturnValue('some_path')
            const checkPathSpy = jest.spyOn(percyBinary, 'checkPath').mockReturnValue(true)

            const result = await percyBinary.getBinaryPath()
            expect(getAvailableDirsSpy).toBeCalledTimes(1)
            expect(checkPathSpy).toBeCalledTimes(1)
            expect(result).toContain('some_path')
            expect(result).toContain('percy')
        })
        it('should getBinaryPath from first download try', async () => {
            const percyBinary = new PercyBinary()
            const getAvailableDirsSpy = jest.spyOn(percyBinary, '_getAvailableDirs').mockReturnValue('some_path')
            const checkPathSpy = jest.spyOn(percyBinary, 'checkPath').mockReturnValue(false)
            const downloadSpy = jest.spyOn(percyBinary, 'download').mockReturnValue('download_path')
            const validateSpy = jest.spyOn(percyBinary, 'validateBinary').mockReturnValue(true)

            const result = await percyBinary.getBinaryPath()
            expect(getAvailableDirsSpy).toBeCalledTimes(1)
            expect(checkPathSpy).toBeCalledTimes(1)
            expect(downloadSpy).toBeCalledTimes(1)
            expect(validateSpy).toBeCalledTimes(1)
            expect(result).toBe('download_path')
        })

        it('should getBinaryPath from second download try', async () => {
            const percyBinary = new PercyBinary()
            const getAvailableDirsSpy = jest.spyOn(percyBinary, '_getAvailableDirs').mockReturnValue('some_path')
            const checkPathSpy = jest.spyOn(percyBinary, 'checkPath').mockReturnValue(false)
            const downloadSpy = jest.spyOn(percyBinary, 'download').mockReturnValue('download_path')
            const validateSpy = jest.spyOn(percyBinary, 'validateBinary').mockReturnValue(false)

            const result = await percyBinary.getBinaryPath()
            expect(getAvailableDirsSpy).toBeCalledTimes(1)
            expect(checkPathSpy).toBeCalledTimes(1)
            expect(downloadSpy).toBeCalledTimes(2)
            expect(validateSpy).toBeCalledTimes(1)
            expect(result).toBe('download_path')
        })
    })

    describe('validateBinary', () => {
        it('should resolve to true for a valid binary version', async () => {
            const percyBinary = new PercyBinary()
            const validVersionOutput = '@percy/cli 1.2.3'
            const mockSpawn = {
                stdout: {
                    on: jest.fn().mockImplementation((data, cb) => {
                        cb(validVersionOutput)
                    })
                },
                on: jest.fn().mockImplementation((close, cb) => {
                    cb(false)
                })
            }
            ;(childProcess.spawn as jest.Mock).mockClear()
            ;(childProcess.spawn as jest.Mock).mockReturnValue(mockSpawn)

            percyBinary.validateBinary(validVersionOutput).then(() => {
            }).catch(() => {
            })

        })
    })
})
