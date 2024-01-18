import PercyBinary from '../src/Percy/PercyBinary'

// Mocking dependencies
jest.mock('got')
jest.mock('node:fs/promises', () => ({
    access: jest.fn(),
    mkdir: jest.fn().mockResolvedValue(true),
}))
jest.mock('node:fs', () => ({
    createWriteStream: jest.fn(),
    chmod: jest.fn().mockImplementation((_, __, callback) => callback()),
}))
jest.mock('yauzl')

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
            expect(result).toBe('some_path/percy')
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
})
