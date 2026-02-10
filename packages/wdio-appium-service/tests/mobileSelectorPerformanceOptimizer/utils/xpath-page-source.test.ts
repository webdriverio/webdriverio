import { describe, expect, test, vi, beforeEach } from 'vitest'
import {
    isSelectorUniqueInPageSource,
    countMatchingElementsByPredicate,
    countMatchingElementsByClassChain
} from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-page-source.js'

vi.mock('@wdio/logger', () => ({
    default: vi.fn(() => ({
        debug: vi.fn()
    }))
}))

const FIXTURES = {
    singleButton: '<XCUIElementTypeButton name="Submit" enabled="true"></XCUIElementTypeButton>',
    singleButtonNameOnly: '<XCUIElementTypeButton name="Submit"></XCUIElementTypeButton>',
    singleButtonNoAttrs: '<XCUIElementTypeButton></XCUIElementTypeButton>',
    duplicateButtons: '<XCUIElementTypeButton name="Submit"></XCUIElementTypeButton><XCUIElementTypeButton name="Submit"></XCUIElementTypeButton>',
    buttonAndTextField: '<XCUIElementTypeButton name="Submit"></XCUIElementTypeButton><XCUIElementTypeTextField name="Submit"></XCUIElementTypeTextField>',
    buttonNameAndLabel: '<XCUIElementTypeButton name="Submit"></XCUIElementTypeButton><XCUIElementTypeButton label="Submit"></XCUIElementTypeButton>',
    twoButtonsDifferentNames: '<XCUIElementTypeButton name="Submit"></XCUIElementTypeButton><XCUIElementTypeButton name="Cancel"></XCUIElementTypeButton>',
    twoButtonsNoAttrs: '<XCUIElementTypeButton></XCUIElementTypeButton><XCUIElementTypeButton></XCUIElementTypeButton>',
}

describe('xpath-page-source', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('isSelectorUniqueInPageSource', () => {
        test('should return true for unique accessibility ID', () => {
            expect(isSelectorUniqueInPageSource('~Submit', FIXTURES.singleButtonNameOnly)).toBe(true)
        })

        test('should return false for non-unique accessibility ID', () => {
            expect(isSelectorUniqueInPageSource('~Submit', FIXTURES.buttonAndTextField)).toBe(false)
        })

        test('should check both name and label for accessibility ID', () => {
            expect(isSelectorUniqueInPageSource('~Submit', FIXTURES.buttonNameAndLabel)).toBe(false)
        })

        test('should return true for unique predicate string', () => {
            expect(isSelectorUniqueInPageSource(
                "-ios predicate string:type == 'XCUIElementTypeButton' AND name == 'Submit'",
                FIXTURES.singleButtonNameOnly
            )).toBe(true)
        })

        test('should return false for non-unique predicate string', () => {
            expect(isSelectorUniqueInPageSource(
                "-ios predicate string:type == 'XCUIElementTypeButton' AND name == 'Submit'",
                FIXTURES.duplicateButtons
            )).toBe(false)
        })

        test('should return true for unique class chain', () => {
            expect(isSelectorUniqueInPageSource(
                '-ios class chain:**/XCUIElementTypeButton[`name == "Submit"`]',
                FIXTURES.singleButtonNameOnly
            )).toBe(true)
        })

        test('should return false for non-unique class chain', () => {
            expect(isSelectorUniqueInPageSource(
                '-ios class chain:**/XCUIElementTypeButton[`name == "Submit"`]',
                FIXTURES.duplicateButtons
            )).toBe(false)
        })

        test('should return false for unknown selector type', () => {
            expect(isSelectorUniqueInPageSource('unknown selector', '')).toBe(false)
        })

        test('should handle errors gracefully and return false', () => {
            expect(isSelectorUniqueInPageSource('~Submit', 'invalid xml <unclosed')).toBe(false)
        })

        test('should handle predicate error gracefully', () => {
            expect(isSelectorUniqueInPageSource('-ios predicate string:invalid', '<invalid xml')).toBe(false)
        })
    })

    describe('countMatchingElementsByPredicate', () => {
        test('should count elements matching predicate', () => {
            const count = countMatchingElementsByPredicate(
                "type == 'XCUIElementTypeButton' AND name == 'Submit'",
                FIXTURES.twoButtonsDifferentNames
            )
            expect(count).toBe(1)
        })

        test('should return 0 when no elements match', () => {
            const pageSource = '<XCUIElementTypeButton name="Cancel"></XCUIElementTypeButton>'
            expect(countMatchingElementsByPredicate("type == 'XCUIElementTypeButton' AND name == 'Submit'", pageSource)).toBe(0)
        })

        test('should count multiple matching elements', () => {
            expect(countMatchingElementsByPredicate(
                "type == 'XCUIElementTypeButton' AND name == 'Submit'",
                FIXTURES.duplicateButtons
            )).toBe(2)
        })

        test('should handle predicate without type', () => {
            expect(countMatchingElementsByPredicate("name == 'Submit'", FIXTURES.buttonAndTextField)).toBe(0)
        })

        test('should skip elements when type does not match', () => {
            expect(countMatchingElementsByPredicate(
                "type == 'XCUIElementTypeButton' AND name == 'Submit'",
                FIXTURES.buttonAndTextField
            )).toBe(1)
        })

        test('should handle multiple conditions', () => {
            expect(countMatchingElementsByPredicate(
                "type == 'XCUIElementTypeButton' AND name == 'Submit' AND enabled == 'true'",
                FIXTURES.singleButton
            )).toBe(1)
        })

        test('should return 0 when predicate conditions do not match', () => {
            const pageSource = '<XCUIElementTypeButton name="Submit" enabled="false"></XCUIElementTypeButton>'
            expect(countMatchingElementsByPredicate(
                "type == 'XCUIElementTypeButton' AND name == 'Submit' AND enabled == 'true'",
                pageSource
            )).toBe(0)
        })
    })

    describe('countMatchingElementsByClassChain', () => {
        test('should count elements matching class chain', () => {
            expect(countMatchingElementsByClassChain(
                '**/XCUIElementTypeButton[`name == "Submit"`]',
                FIXTURES.singleButtonNameOnly
            )).toBe(1)
        })

        test('should return 0 when no element type in chain (wildcard)', () => {
            expect(countMatchingElementsByClassChain('**/*', '')).toBe(0)
            expect(countMatchingElementsByClassChain('**/*', FIXTURES.singleButtonNoAttrs)).toBe(0)
        })

        test('should count multiple matching elements', () => {
            expect(countMatchingElementsByClassChain(
                '**/XCUIElementTypeButton[`name == "Submit"`]',
                FIXTURES.duplicateButtons
            )).toBe(2)
        })

        test('should handle class chain without predicates', () => {
            expect(countMatchingElementsByClassChain('**/XCUIElementTypeButton', FIXTURES.twoButtonsNoAttrs)).toBe(2)
        })

        test('should handle multiple predicate conditions', () => {
            expect(countMatchingElementsByClassChain(
                '**/XCUIElementTypeButton[`name == "Submit" AND enabled == "true"`]',
                FIXTURES.singleButton
            )).toBe(1)
        })

        test('should return 0 when no elements match', () => {
            const pageSource = '<XCUIElementTypeButton name="Cancel"></XCUIElementTypeButton>'
            expect(countMatchingElementsByClassChain('**/XCUIElementTypeButton[`name == "Submit"`]', pageSource)).toBe(0)
        })

        test('should return 0 when predicates do not match', () => {
            const pageSource = '<XCUIElementTypeButton name="Submit" enabled="false"></XCUIElementTypeButton>'
            expect(countMatchingElementsByClassChain(
                '**/XCUIElementTypeButton[`name == "Submit" AND enabled == "true"`]',
                pageSource
            )).toBe(0)
        })

        test('should handle class chain with invalid predicates gracefully', () => {
            expect(countMatchingElementsByClassChain(
                '**/XCUIElementTypeButton[`invalid`]',
                FIXTURES.singleButtonNoAttrs
            )).toBeGreaterThanOrEqual(0)
        })
    })
})
