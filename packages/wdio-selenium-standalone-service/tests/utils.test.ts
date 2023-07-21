import path from 'node:path'
import { describe, expect, test, beforeAll } from 'vitest'

import { getFilePath } from '../src/utils.js'

describe('getFilePath', () => {
    let basePath: string
    let defaultFilename: string

    beforeAll(() => {
        basePath = process.cwd()
        defaultFilename = 'selenium-standalone.txt'
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

        expect(filePath).toMatch(/(\w:)?(\\|\/)selenium-standalone\.txt/)
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

        expect(filePath).toMatch(/(\w:)?(\\|\/)log(\\|\/)selenium-standalone\.txt/)
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

        expect(filePath).toMatch(/(\w:)?(\\|\/)/)
    })

    test('should handle dir "./log/selenium"', () => {
        const dir = './log/selenium'
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

    test('should handle dir "/log/selenium', () => {
        const dir = '/log/selenium'
        const filePath = getFilePath(dir, defaultFilename)

        expect(filePath).toMatch(/(\w:)?(\\|\/)log(\\|\/)selenium(\\|\/)selenium-standalone\.txt/)
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

    test('should handle file "./selenium-log.txt"', () => {
        const file = './selenium-log.txt'
        const filePath = getFilePath(file, defaultFilename)

        expect(filePath).toMatch(/(\w:)?(\\|\/)selenium-log\.txt/)
    })

    test('should handle file "selenium-log.txt"', () => {
        const file = 'selenium-log.txt'
        const expectedPath = path.join(basePath, file)
        const filePath = getFilePath(file, defaultFilename)

        expect(filePath).toBe(expectedPath)
    })

    test('should handle file "/selenium-log.txt', () => {
        const file = '/selenium-log.txt'
        const filePath = getFilePath(file, defaultFilename)

        expect(filePath).toMatch(/(\w:)?(\\|\/)selenium-log\.txt/)
    })

    test('should handle file "./log/selenium-log.txt"', () => {
        const file = './log/selenium-log.txt'
        const expectedPath = path.join(basePath, file)
        const filePath = getFilePath(file, defaultFilename)

        expect(filePath).toBe(expectedPath)
    })

    test('should handle file "log/selenium-log.txt"', () => {
        const file = 'log/selenium-log.txt'
        const expectedPath = path.join(basePath, file)
        const filePath = getFilePath(file, defaultFilename)

        expect(filePath).toBe(expectedPath)
    })

    test('should handle file "/log/selenium-log.txt', () => {
        const file = '/log/selenium-log.txt'
        const filePath = getFilePath(file, defaultFilename)

        expect(filePath).toMatch(/(\w:)?(\\|\/)log(\\|\/)selenium-log\.txt/)
    })
})
