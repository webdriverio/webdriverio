import { getFilePath, getAppiumCommand, cliArgsFromKeyValue } from '../src/utils'
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

describe('_getAppiumCommand', () => {
    test('should return path to dependency', () => {
        expect(getAppiumCommand('fs-extra'))
            .toBe(path.join(process.cwd(), 'packages/wdio-appium-service/node_modules/fs-extra/lib/index.js'))
    })
    test('should be appium by default', () => {
        expect(() => getAppiumCommand())
            .toThrow("Cannot find module 'appium' from 'packages/wdio-appium-service/src/utils.js'")
    })
})

describe('argument formatting', () => {
    test('should format arguments correctly', () => {
        const args = cliArgsFromKeyValue({
            address: '127.0.0.1',
            commandTimeout: '7200',
            showIosLog: false,
            sessionOverride: true,
            app: '/Users/frodo/My Projects/the-ring/the-ring.app'
        })

        expect(args[0]).toBe('--address')
        expect(args[1]).toBe('127.0.0.1')
        expect(args[2]).toBe('--command-timeout')
        expect(args[3]).toBe('7200')
        expect(args[4]).toBe('--session-override')
    })
    test('should not format arguments if array passed', () => {
        const argsArray = ['-p', 4723]
        const args = cliArgsFromKeyValue(argsArray)

        expect(args).toBe(argsArray)
    })
})
