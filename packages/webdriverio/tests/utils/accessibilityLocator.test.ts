import path from 'node:path'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ELEMENT_KEY } from 'webdriver'
import { findAccessibilityElement, findAccessibilityElements } from '../../src/utils/accessibilityLocator.js'
import { StrictSelectorError } from '../../src/errors/StrictSelectorError.js'

// Mock logger
import logger from '@wdio/logger'
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
const log = logger('webdriverio')

describe('accessibilityLocator', () => {
    let browser: any

    beforeEach(() => {
        browser = {
            isBidi: false,
            execute: vi.fn(),
            options: {},
            sessionId: 'mock-session-id'
        }
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('findAccessibilityElement', () => {
        it('should return element if found', async () => {
            const mockElement = { [ELEMENT_KEY]: 'some-id' }
            browser.execute.mockResolvedValue({
                elements: [mockElement],
                descriptors: ['button'],
                capHit: false
            })

            const result = await findAccessibilityElement.call(browser, { name: 'Submit' })
            expect(result).toBe(mockElement)
            expect(browser.execute).toHaveBeenCalledTimes(1)
        })

        it('should return error if not found', async () => {
            browser.execute.mockResolvedValue({
                elements: [],
                descriptors: [],
                capHit: false
            })

            const result = await findAccessibilityElement.call(browser, { name: 'Submit' })
            expect(result).toBeInstanceOf(Error)
            expect((result as Error).message).toContain("Couldn't find element")
        })

        it('should throw StrictSelectorError if strict mode is on and multiple found', async () => {
            browser.execute.mockResolvedValue({
                elements: [
                    { [ELEMENT_KEY]: 'id-1' },
                    { [ELEMENT_KEY]: 'id-2' }
                ],
                descriptors: ['button#1', 'div#2'],
                capHit: false
            })

            await expect(findAccessibilityElement.call(browser, { name: 'Submit' }, { a11yStrict: true }))
                .rejects.toThrow(StrictSelectorError)
        })

        it('should log warning if strict mode is "warn" and multiple found', async () => {
            browser.execute.mockResolvedValue({
                elements: [
                    { [ELEMENT_KEY]: 'id-1' },
                    { [ELEMENT_KEY]: 'id-2' }
                ],
                descriptors: ['button#1', 'div#2'],
                capHit: false
            })

            const result = await findAccessibilityElement.call(browser, { name: 'Submit' }, { a11yStrict: 'warn' })
            expect(result).toEqual({ [ELEMENT_KEY]: 'id-1' })
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('Strict mode violation'))
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('matched 2 elements'))
        })

        it('should support legacy "strict" option with deprecation warning', async () => {
            browser.execute.mockResolvedValue({
                elements: [
                    { [ELEMENT_KEY]: 'id-1' },
                    { [ELEMENT_KEY]: 'id-2' }
                ],
                descriptors: ['button#1', 'div#2'],
                capHit: false
            })

            await expect(findAccessibilityElement.call(browser, { name: 'Submit' }, { strict: true }))
                .rejects.toThrow(StrictSelectorError)
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('option is deprecated'))
        })

        it('should prioritize "a11yStrict" over "strict" if both present', async () => {
            browser.execute.mockResolvedValue({
                elements: [
                    { [ELEMENT_KEY]: 'id-1' },
                    { [ELEMENT_KEY]: 'id-2' }
                ],
                descriptors: ['button#1', 'div#2'],
                capHit: false
            })

            // strict=false (legacy) should be ignored in favor of a11yStrict=true
            await expect(findAccessibilityElement.call(browser, { name: 'Submit' }, { strict: false, a11yStrict: true }))
                .rejects.toThrow(StrictSelectorError)
            expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('option is deprecated'))
        })

        it('should handle BiDi browser via execute (script fallback)', async () => {
            browser.isBidi = true
            browser.execute.mockResolvedValue({
                elements: [{ [ELEMENT_KEY]: 'id-1' }],
                descriptors: ['button'],
                capHit: false
            })

            const result = await findAccessibilityElement.call(browser, { name: 'Submit' })
            expect(result).toEqual({ [ELEMENT_KEY]: 'id-1' })
            expect(browser.execute).toHaveBeenCalled()
        })
    })

    describe('findAccessibilityElements', () => {
        it('should return all found elements', async () => {
            const mockElements = [
                { [ELEMENT_KEY]: 'id-1' },
                { [ELEMENT_KEY]: 'id-2' }
            ]
            browser.execute.mockResolvedValue({
                elements: mockElements,
                descriptors: ['button', 'div'],
                capHit: false
            })

            const result = await findAccessibilityElements.call(browser, { name: 'Submit' })
            expect(result).toEqual(mockElements)
        })
    })
})
