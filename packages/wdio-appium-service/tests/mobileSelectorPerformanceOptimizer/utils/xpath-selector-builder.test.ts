import { describe, expect, test, vi, beforeEach } from 'vitest'
import { buildSelectorFromElementData } from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-selector-builder.js'
import * as xpathPageSource from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-page-source.js'

vi.mock('../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-page-source.js', () => ({
    isSelectorUniqueInPageSource: vi.fn()
}))

describe('xpath-selector-builder', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('buildSelectorFromElementData', () => {
        describe('accessibility ID selection', () => {
            test('should return accessibility ID when name is unique', () => {
                vi.mocked(xpathPageSource.isSelectorUniqueInPageSource).mockReturnValue(true)

                const result = buildSelectorFromElementData(
                    { type: 'XCUIElementTypeButton', attributes: { name: 'Submit' } },
                    '<pageSource/>'
                )

                expect(result).toEqual({ selector: '~Submit' })
                expect(xpathPageSource.isSelectorUniqueInPageSource).toHaveBeenCalledWith('~Submit', '<pageSource/>')
            })

            test('should prefer name over label for accessibility ID', () => {
                vi.mocked(xpathPageSource.isSelectorUniqueInPageSource).mockReturnValue(true)

                const result = buildSelectorFromElementData(
                    { type: 'XCUIElementTypeButton', attributes: { name: 'Submit', label: 'Other' } },
                    '<pageSource/>'
                )

                expect(result).toEqual({ selector: '~Submit' })
            })

            test('should use label when name not available', () => {
                vi.mocked(xpathPageSource.isSelectorUniqueInPageSource).mockReturnValue(true)

                const result = buildSelectorFromElementData(
                    { type: 'XCUIElementTypeButton', attributes: { label: 'Submit' } },
                    '<pageSource/>'
                )

                expect(result).toEqual({ selector: '~Submit' })
            })
        })

        describe('predicate string fallback', () => {
            test('should fallback to predicate string when accessibility ID not unique', () => {
                vi.mocked(xpathPageSource.isSelectorUniqueInPageSource)
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(true)

                const result = buildSelectorFromElementData(
                    { type: 'XCUIElementTypeButton', attributes: { name: 'Submit' } },
                    '<pageSource/>'
                )

                expect(result).toEqual({
                    selector: "-ios predicate string:type == 'XCUIElementTypeButton'"
                })
            })

            test('should progressively add attributes until unique', () => {
                vi.mocked(xpathPageSource.isSelectorUniqueInPageSource)
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(true)

                const result = buildSelectorFromElementData(
                    { type: 'XCUIElementTypeButton', attributes: { name: 'Submit' } },
                    '<pageSource/>'
                )

                expect(result).toEqual({
                    selector: "-ios predicate string:type == 'XCUIElementTypeButton' AND name == 'Submit'"
                })
            })

            test('should skip label when name equals label', () => {
                vi.mocked(xpathPageSource.isSelectorUniqueInPageSource)
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(true)

                const result = buildSelectorFromElementData(
                    { type: 'XCUIElementTypeButton', attributes: { name: 'Submit', label: 'Submit' } },
                    '<pageSource/>'
                )

                expect(result?.selector).toContain("name == 'Submit'")
                expect(result?.selector).not.toContain("label == 'Submit'")
            })

            test('should continue when label equals name in meaningful attributes loop', () => {
                vi.mocked(xpathPageSource.isSelectorUniqueInPageSource)
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(true)

                const result = buildSelectorFromElementData(
                    { type: 'XCUIElementTypeButton', attributes: { name: 'Submit', label: 'Submit', value: 'Click' } },
                    '<pageSource/>'
                )

                expect(result?.selector).toContain("name == 'Submit'")
                expect(result?.selector).toContain("value == 'Click'")
                expect(result?.selector).not.toContain("label == 'Submit'")
            })

            test('should add boolean attributes when meaningful attributes not enough', () => {
                vi.mocked(xpathPageSource.isSelectorUniqueInPageSource)
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(true)

                const result = buildSelectorFromElementData(
                    { type: 'XCUIElementTypeButton', attributes: { name: 'Test', enabled: 'true' } },
                    '<pageSource/>'
                )

                expect(result).toEqual({
                    selector: "-ios predicate string:type == 'XCUIElementTypeButton' AND name == 'Test' AND enabled == 'true'"
                })
            })

            test('should skip boolean attributes that are not "true"', () => {
                vi.mocked(xpathPageSource.isSelectorUniqueInPageSource).mockReturnValue(true)

                const result = buildSelectorFromElementData(
                    { type: 'XCUIElementTypeButton', attributes: { name: 'Test', enabled: 'false' } },
                    '<pageSource/>'
                )

                expect(result).toEqual({ selector: '~Test' })
            })

            test('should return predicate with warning when all attempts fail', () => {
                vi.mocked(xpathPageSource.isSelectorUniqueInPageSource).mockReturnValue(false)

                const result = buildSelectorFromElementData(
                    { type: 'XCUIElementTypeButton', attributes: { name: 'Submit' } },
                    '<pageSource/>'
                )

                expect(result).toEqual({
                    selector: "-ios predicate string:type == 'XCUIElementTypeButton' AND name == 'Submit'",
                    warning: 'Selector may match multiple elements. Consider adding more specific attributes.'
                })
            })

            test('should return predicate with all parts when meaningfulOnlyParts length is 1', () => {
                vi.mocked(xpathPageSource.isSelectorUniqueInPageSource).mockReturnValue(false)

                const result = buildSelectorFromElementData(
                    { type: 'XCUIElementTypeButton', attributes: { enabled: 'true' } },
                    '<pageSource/>'
                )

                expect(result).toEqual({
                    selector: "-ios predicate string:type == 'XCUIElementTypeButton' AND enabled == 'true'",
                    warning: 'Selector may match multiple elements. Consider adding more specific attributes.'
                })
            })

            test('should filter out empty or non-string attribute values', () => {
                vi.mocked(xpathPageSource.isSelectorUniqueInPageSource).mockReturnValue(true)

                const result1 = buildSelectorFromElementData(
                    { type: 'XCUIElementTypeButton', attributes: { name: 'Test', value: '' } },
                    '<pageSource/>'
                )
                expect(result1).toEqual({ selector: '~Test' })

                const result2 = buildSelectorFromElementData(
                    { type: 'XCUIElementTypeButton', attributes: { name: 'Test', value: 123 as any } },
                    '<pageSource/>'
                )
                expect(result2).toEqual({ selector: '~Test' })
            })
        })

        describe('class chain fallback', () => {
            test('should fallback to class chain when predicate returns null', () => {
                vi.mocked(xpathPageSource.isSelectorUniqueInPageSource)
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(false)
                    .mockReturnValue(false)

                const result = buildSelectorFromElementData(
                    { type: 'XCUIElementTypeButton', attributes: {} },
                    '<pageSource/>'
                )

                expect(result).toEqual({
                    selector: '-ios class chain:**/XCUIElementTypeButton',
                    warning: 'Selector may match multiple elements. Consider adding more specific attributes.'
                })
            })

            test('should return unique class chain with predicates when predicate returns null', () => {
                vi.mocked(xpathPageSource.isSelectorUniqueInPageSource)
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(true)

                const result = buildSelectorFromElementData(
                    { type: 'XCUIElementTypeButton', attributes: { enabled: 'false' } },
                    '<pageSource/>'
                )

                expect(result).toEqual({
                    selector: '-ios class chain:**/XCUIElementTypeButton[`enabled == "false"`]'
                })
            })

            test('should progressively add attributes in class chain until unique', () => {
                vi.mocked(xpathPageSource.isSelectorUniqueInPageSource)
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(true)

                const result = buildSelectorFromElementData(
                    { type: 'XCUIElementTypeButton', attributes: { enabled: 'false', visible: 'false' } },
                    '<pageSource/>'
                )

                expect(result).toEqual({
                    selector: '-ios class chain:**/XCUIElementTypeButton[`enabled == "false" AND visible == "false"`]'
                })
            })

            test('should return class chain with predicates and warning when predicateParts length greater than 0', () => {
                vi.mocked(xpathPageSource.isSelectorUniqueInPageSource)
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(false)
                    .mockReturnValue(false)

                const result = buildSelectorFromElementData(
                    { type: 'XCUIElementTypeButton', attributes: { enabled: 'false' } },
                    '<pageSource/>'
                )

                expect(result).toEqual({
                    selector: '-ios class chain:**/XCUIElementTypeButton[`enabled == "false"`]',
                    warning: 'Selector may match multiple elements. Consider adding more specific attributes.'
                })
            })

            test('should return unique basic class chain without predicates', () => {
                vi.mocked(xpathPageSource.isSelectorUniqueInPageSource)
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(true)

                const result = buildSelectorFromElementData(
                    { type: 'XCUIElementTypeButton', attributes: {} },
                    '<pageSource/>'
                )

                expect(result).toEqual({
                    selector: '-ios class chain:**/XCUIElementTypeButton'
                })
            })

            test('should return class chain with warning when not unique', () => {
                vi.mocked(xpathPageSource.isSelectorUniqueInPageSource).mockReturnValue(false)

                const result = buildSelectorFromElementData(
                    { type: 'XCUIElementTypeButton', attributes: {} },
                    '<pageSource/>'
                )

                expect(result).toEqual({
                    selector: '-ios class chain:**/XCUIElementTypeButton',
                    warning: 'Selector may match multiple elements. Consider adding more specific attributes.'
                })
            })
        })

        describe('null selector fallback', () => {
            test('should return null selector when no type provided', () => {
                const result = buildSelectorFromElementData(
                    { type: '', attributes: { name: 'Test' } },
                    '<pageSource/>'
                )

                expect(result).toEqual({
                    selector: null,
                    warning: 'Could not generate a unique selector from element data. Multiple elements may match the suggested selector.'
                })
            })

            test('should return null selector when type is undefined', () => {
                const result = buildSelectorFromElementData(
                    { type: undefined as any, attributes: { name: 'Test' } },
                    '<pageSource/>'
                )

                expect(result).toEqual({
                    selector: null,
                    warning: 'Could not generate a unique selector from element data. Multiple elements may match the suggested selector.'
                })
            })
        })
    })
})
