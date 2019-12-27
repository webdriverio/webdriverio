import getFilePath from '../../src/utils/getFilePath'
import path from 'path'

describe('getFilePath', () => {
    let basePath = null
    let defaultFilename = null

    beforeAll(() => {
        basePath = process.cwd()
        defaultFilename = 'appium-standalone.txt'
    })

    test('should handle dir "./"', () => {
        const dir = './'
        const expectedPath = path.join(basePath, defaultFilename)
        const filePath = getFilePath(dir, defaultFilename)

        expect(filePath).toBe(expectedPath)
    })

    test('should handle dir "/', () => {
        const dir = '/'
        const filePath = getFilePath(dir, defaultFilename)

        expect(filePath).toMatch(/(\w:)?(\\|\/)appium-standalone\.txt/)
    })

    test('should handle dir "./log"', () => {
        const dir = './log'
        const expectedPath = path.join(basePath, dir, defaultFilename)
        const filePath = getFilePath(dir, defaultFilename)

        expect(filePath).toBe(expectedPath)
    })

    test('should handle dir "/log', () => {
        const dir = '/log'
        const filePath = getFilePath(dir, defaultFilename)

        expect(filePath).toMatch(/(\w:)?(\\|\/)log(\\|\/)appium-standalone\.txt/)
    })

    test('should handle dir "./log/"', () => {
        const dir = './log/'
        const expectedPath = path.join(basePath, dir, defaultFilename)
        const filePath = getFilePath(dir, defaultFilename)

        expect(filePath).toBe(expectedPath)
    })

    test('should handle dir "/log/', () => {
        const dir = '/log/'
        const filePath = getFilePath(dir, defaultFilename)

        expect(filePath).toMatch(/(\w:)?(\\|\/)log(\\|\/)appium-standalone\.txt/)
    })

    test('should handle dir "./log/appium"', () => {
        const dir = './log/appium'
        const expectedPath = path.join(basePath, dir, defaultFilename)
        const filePath = getFilePath(dir, defaultFilename)

        expect(filePath).toBe(expectedPath)
    })

    test('should handle dir "log"', () => {
        const dir = 'log'
        const expectedPath = path.join(basePath, dir, defaultFilename)
        const filePath = getFilePath(dir, defaultFilename)

        expect(filePath).toBe(expectedPath)
    })

    test('should handle dir "/log/appium', () => {
        const dir = '/log/appium'
        const filePath = getFilePath(dir, defaultFilename)

        expect(filePath).toMatch(/(\w:)?(\\|\/)log(\\|\/)appium(\\|\/)appium-standalone\.txt/)
    })

    test('should handle file ".log"', () => {
        const file = '.log'
        const expectedPath = path.join(basePath, file)
        const filePath = getFilePath(file, defaultFilename)

        expect(filePath).toBe(expectedPath)
    })

    test('should handle file "./.log"', () => {
        const file = './.log'
        const expectedPath = path.join(basePath, file)
        const filePath = getFilePath(file, defaultFilename)

        expect(filePath).toBe(expectedPath)
    })

    test('should handle file "./log/.log"', () => {
        const file = './log/.log'
        const expectedPath = path.join(basePath, file)
        const filePath = getFilePath(file, defaultFilename)

        expect(filePath).toBe(expectedPath)
    })

    test('should handle file "./appium-log.txt"', () => {
        const file = './appium-log.txt'
        const expectedPath = path.join(basePath, file)
        const filePath = getFilePath(file, defaultFilename)

        expect(filePath).toBe(expectedPath)
    })

    test('should handle file "appium-log.txt"', () => {
        const file = 'appium-log.txt'
        const expectedPath = path.join(basePath, file)
        const filePath = getFilePath(file, defaultFilename)

        expect(filePath).toBe(expectedPath)
    })

    test('should handle file "/appium-log.txt', () => {
        const file = '/appium-log.txt'
        const filePath = getFilePath(file, defaultFilename)

        expect(filePath).toMatch(/(\w:)?(\\|\/)appium-log\.txt/)
    })

    test('should handle file "./log/appium-log.txt"', () => {
        const file = './log/appium-log.txt'
        const expectedPath = path.join(basePath, file)
        const filePath = getFilePath(file, defaultFilename)

        expect(filePath).toBe(expectedPath)
    })

    test('should handle file "log/appium-log.txt"', () => {
        const file = 'log/appium-log.txt'
        const expectedPath = path.join(basePath, file)
        const filePath = getFilePath(file, defaultFilename)

        expect(filePath).toBe(expectedPath)
    })

    test('should handle file "/log/appium-log.txt', () => {
        const file = '/log/appium-log.txt'
        const filePath = getFilePath(file, defaultFilename)

        expect(filePath).toMatch(/(\w:)?(\\|\/)log(\\|\/)appium-log\.txt/)
    })
})
