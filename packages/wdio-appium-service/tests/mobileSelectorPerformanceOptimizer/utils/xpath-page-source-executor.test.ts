import { describe, expect, test, vi, beforeEach } from 'vitest'
import {
    executeXPathOnPageSource,
    findElementByXPathWithFallback
} from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-page-source-executor.js'

vi.mock('@wdio/logger', () => ({
    default: vi.fn(() => ({
        debug: vi.fn()
    }))
}))

// Page source fixtures representing realistic iOS app XML structure
const PAGE_SOURCE_WITH_SIBLINGS = `<?xml version="1.0" encoding="UTF-8"?>
<XCUIElementTypeApplication type="XCUIElementTypeApplication" name="TestApp">
  <XCUIElementTypeWindow type="XCUIElementTypeWindow">
    <XCUIElementTypeOther type="XCUIElementTypeOther">
      <XCUIElementTypeStaticText type="XCUIElementTypeStaticText" name="Label1" label="First Label" value="Label1"></XCUIElementTypeStaticText>
      <XCUIElementTypeButton type="XCUIElementTypeButton" name="Button1" label="Click Me" enabled="true"></XCUIElementTypeButton>
      <XCUIElementTypeStaticText type="XCUIElementTypeStaticText" name="Label2" label="Second Label" value="Label2"></XCUIElementTypeStaticText>
    </XCUIElementTypeOther>
  </XCUIElementTypeWindow>
</XCUIElementTypeApplication>`

const PAGE_SOURCE_WITH_PARENT = `<?xml version="1.0" encoding="UTF-8"?>
<XCUIElementTypeApplication type="XCUIElementTypeApplication" name="TestApp">
  <XCUIElementTypeWindow type="XCUIElementTypeWindow">
    <XCUIElementTypeCell type="XCUIElementTypeCell" name="Cell1" label="Cell 1">
      <XCUIElementTypeButton type="XCUIElementTypeButton" name="CellButton" label="Cell Action"></XCUIElementTypeButton>
    </XCUIElementTypeCell>
    <XCUIElementTypeCell type="XCUIElementTypeCell" name="Cell2" label="Cell 2">
      <XCUIElementTypeButton type="XCUIElementTypeButton" name="CellButton" label="Cell Action"></XCUIElementTypeButton>
    </XCUIElementTypeCell>
  </XCUIElementTypeWindow>
</XCUIElementTypeApplication>`

const PAGE_SOURCE_SIMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<XCUIElementTypeApplication type="XCUIElementTypeApplication" name="TestApp">
  <XCUIElementTypeButton type="XCUIElementTypeButton" name="Submit" label="Submit Button" enabled="true"></XCUIElementTypeButton>
</XCUIElementTypeApplication>`

const PAGE_SOURCE_MULTIPLE_MATCHES = `<?xml version="1.0" encoding="UTF-8"?>
<XCUIElementTypeApplication type="XCUIElementTypeApplication" name="TestApp">
  <XCUIElementTypeButton type="XCUIElementTypeButton" name="Submit" label="Submit" enabled="true"></XCUIElementTypeButton>
  <XCUIElementTypeButton type="XCUIElementTypeButton" name="Submit" label="Submit" enabled="true"></XCUIElementTypeButton>
</XCUIElementTypeApplication>`

describe('xpath-page-source-executor', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('executeXPathOnPageSource', () => {
        test('should execute simple XPath and return matching elements', () => {
            const result = executeXPathOnPageSource(
                '//XCUIElementTypeButton[@name="Submit"]',
                PAGE_SOURCE_SIMPLE
            )

            expect(result).not.toBeNull()
            expect(result).toHaveLength(1)
            expect(result![0].type).toBe('XCUIElementTypeButton')
            expect(result![0].attributes.name).toBe('Submit')
            expect(result![0].attributes.label).toBe('Submit Button')
        })

        test('should execute following-sibling XPath', () => {
            const result = executeXPathOnPageSource(
                '//XCUIElementTypeStaticText[@name="Label1"]/following-sibling::XCUIElementTypeButton',
                PAGE_SOURCE_WITH_SIBLINGS
            )

            expect(result).not.toBeNull()
            expect(result).toHaveLength(1)
            expect(result![0].type).toBe('XCUIElementTypeButton')
            expect(result![0].attributes.name).toBe('Button1')
        })

        test('should execute preceding-sibling XPath', () => {
            const result = executeXPathOnPageSource(
                '//XCUIElementTypeStaticText[@name="Label2"]/preceding-sibling::XCUIElementTypeButton',
                PAGE_SOURCE_WITH_SIBLINGS
            )

            expect(result).not.toBeNull()
            expect(result).toHaveLength(1)
            expect(result![0].type).toBe('XCUIElementTypeButton')
            expect(result![0].attributes.name).toBe('Button1')
        })

        test('should execute parent axis XPath', () => {
            const result = executeXPathOnPageSource(
                '//XCUIElementTypeButton[@name="CellButton"]/parent::XCUIElementTypeCell[@name="Cell1"]',
                PAGE_SOURCE_WITH_PARENT
            )

            expect(result).not.toBeNull()
            expect(result).toHaveLength(1)
            expect(result![0].type).toBe('XCUIElementTypeCell')
            expect(result![0].attributes.name).toBe('Cell1')
        })

        test('should execute parent shorthand (..) XPath', () => {
            // XPath parent shorthand: //element/.. selects the parent
            // To filter parent by attribute, use: //element/../self::*[@attr="val"]
            // or the simpler: //element/parent::*[@attr="val"]
            const result = executeXPathOnPageSource(
                '//XCUIElementTypeButton[@name="CellButton"]/..',
                PAGE_SOURCE_WITH_PARENT
            )

            expect(result).not.toBeNull()
            // This will return both parent cells since both contain a CellButton
            expect(result!.length).toBeGreaterThanOrEqual(1)
            expect(result![0].type).toBe('XCUIElementTypeCell')
        })

        test('should return empty array when no matches found', () => {
            const result = executeXPathOnPageSource(
                '//XCUIElementTypeButton[@name="NonExistent"]',
                PAGE_SOURCE_SIMPLE
            )

            expect(result).toEqual([])
        })

        test('should return multiple matching elements', () => {
            const result = executeXPathOnPageSource(
                '//XCUIElementTypeButton[@name="Submit"]',
                PAGE_SOURCE_MULTIPLE_MATCHES
            )

            expect(result).not.toBeNull()
            expect(result).toHaveLength(2)
        })

        test('should return null for invalid XPath', () => {
            const result = executeXPathOnPageSource(
                '//[invalid',
                PAGE_SOURCE_SIMPLE
            )

            expect(result).toBeNull()
        })

        test('should return null for invalid XML', () => {
            const result = executeXPathOnPageSource(
                '//XCUIElementTypeButton',
                '<invalid xml'
            )

            expect(result).toBeNull()
        })

        test('should handle empty page source', () => {
            const result = executeXPathOnPageSource(
                '//XCUIElementTypeButton',
                ''
            )

            expect(result).toBeNull()
        })

        test('should extract all element attributes', () => {
            const result = executeXPathOnPageSource(
                '//XCUIElementTypeButton[@name="Submit"]',
                PAGE_SOURCE_SIMPLE
            )

            expect(result).not.toBeNull()
            expect(result![0].attributes).toEqual({
                type: 'XCUIElementTypeButton',
                name: 'Submit',
                label: 'Submit Button',
                enabled: 'true'
            })
        })
    })

    describe('findElementByXPathWithFallback', () => {
        test('should return element data with match count when unique', () => {
            const result = findElementByXPathWithFallback(
                '//XCUIElementTypeButton[@name="Submit"]',
                PAGE_SOURCE_SIMPLE
            )

            expect(result).not.toBeNull()
            expect(result!.element).toBeDefined()
            expect(result!.element.type).toBe('XCUIElementTypeButton')
            expect(result!.matchCount).toBe(1)
        })

        test('should return element data with match count when not unique', () => {
            const result = findElementByXPathWithFallback(
                '//XCUIElementTypeButton[@name="Submit"]',
                PAGE_SOURCE_MULTIPLE_MATCHES
            )

            expect(result).not.toBeNull()
            expect(result!.element).toBeDefined()
            expect(result!.matchCount).toBe(2)
        })

        test('should return null when no element found', () => {
            const result = findElementByXPathWithFallback(
                '//XCUIElementTypeButton[@name="NonExistent"]',
                PAGE_SOURCE_SIMPLE
            )

            expect(result).toBeNull()
        })

        test('should work with sibling axis XPath', () => {
            const result = findElementByXPathWithFallback(
                '//XCUIElementTypeStaticText[@name="Label1"]/following-sibling::XCUIElementTypeButton',
                PAGE_SOURCE_WITH_SIBLINGS
            )

            expect(result).not.toBeNull()
            expect(result!.element.type).toBe('XCUIElementTypeButton')
            expect(result!.element.attributes.name).toBe('Button1')
            expect(result!.matchCount).toBe(1)
        })
    })

    describe('real-world unmappable selectors (LOGIN button scenario)', () => {
        // Page source that mimics a real iOS login screen
        const PAGE_SOURCE_LOGIN_SCREEN = `<?xml version="1.0" encoding="UTF-8"?>
<XCUIElementTypeApplication type="XCUIElementTypeApplication" name="MyApp">
  <XCUIElementTypeWindow type="XCUIElementTypeWindow">
    <XCUIElementTypeOther type="XCUIElementTypeOther" name="login-container">
      <XCUIElementTypeOther type="XCUIElementTypeOther" name="button-LOGIN">
        <XCUIElementTypeStaticText type="XCUIElementTypeStaticText" name="LOGIN" label="LOGIN" value="LOGIN"></XCUIElementTypeStaticText>
      </XCUIElementTypeOther>
      <XCUIElementTypeOther type="XCUIElementTypeOther" name="button-biometric">
        <XCUIElementTypeStaticText type="XCUIElementTypeStaticText" name="BIOMETRIC" label="BIOMETRIC" value="BIOMETRIC"></XCUIElementTypeStaticText>
      </XCUIElementTypeOther>
    </XCUIElementTypeOther>
  </XCUIElementTypeWindow>
</XCUIElementTypeApplication>`

        test('selector 1: ancestor axis', () => {
            const result = executeXPathOnPageSource(
                '//XCUIElementTypeStaticText[@name="LOGIN"]/ancestor::XCUIElementTypeOther[@name="button-LOGIN"]',
                PAGE_SOURCE_LOGIN_SCREEN
            )

            expect(result).not.toBeNull()
            expect(result).toHaveLength(1)
            expect(result![0].type).toBe('XCUIElementTypeOther')
            expect(result![0].attributes.name).toBe('button-LOGIN')
        })

        test('selector 2: ancestor-or-self axis', () => {
            const result = executeXPathOnPageSource(
                '//XCUIElementTypeStaticText[@name="LOGIN"]/ancestor-or-self::XCUIElementTypeOther[@name="button-LOGIN"]',
                PAGE_SOURCE_LOGIN_SCREEN
            )

            expect(result).not.toBeNull()
            expect(result).toHaveLength(1)
            expect(result![0].type).toBe('XCUIElementTypeOther')
            expect(result![0].attributes.name).toBe('button-LOGIN')
        })

        test('selector 3: parent axis', () => {
            const result = executeXPathOnPageSource(
                '//XCUIElementTypeStaticText[@name="LOGIN"]/parent::XCUIElementTypeOther',
                PAGE_SOURCE_LOGIN_SCREEN
            )

            expect(result).not.toBeNull()
            expect(result).toHaveLength(1)
            expect(result![0].type).toBe('XCUIElementTypeOther')
            expect(result![0].attributes.name).toBe('button-LOGIN')
        })

        test('selector 4: parent shorthand with ancestor', () => {
            const result = executeXPathOnPageSource(
                '//XCUIElementTypeStaticText[@name="LOGIN"]/../ancestor::XCUIElementTypeOther[@name="button-LOGIN"]',
                PAGE_SOURCE_LOGIN_SCREEN
            )

            // This returns empty because .. goes to parent (button-LOGIN),
            // then ancestor::XCUIElementTypeOther[@name="button-LOGIN"] looks for ancestor with that name
            // but button-LOGIN is NOT an ancestor of itself (it's the parent we're on)
            // This XPath doesn't match the intended logic
            expect(result).toEqual([])
        })

        test('selector 5: ancestor with following-sibling', () => {
            const result = executeXPathOnPageSource(
                '//XCUIElementTypeStaticText[@name="LOGIN"]/ancestor::XCUIElementTypeOther[@name="button-LOGIN"]/following-sibling::XCUIElementTypeOther[@name="button-biometric"]',
                PAGE_SOURCE_LOGIN_SCREEN
            )

            expect(result).not.toBeNull()
            expect(result).toHaveLength(1)
            expect(result![0].type).toBe('XCUIElementTypeOther')
            expect(result![0].attributes.name).toBe('button-biometric')
        })

        test('selector 6: preceding-sibling', () => {
            const result = executeXPathOnPageSource(
                '//XCUIElementTypeOther[@name="button-biometric"]/preceding-sibling::XCUIElementTypeOther[@name="button-LOGIN"]',
                PAGE_SOURCE_LOGIN_SCREEN
            )

            expect(result).not.toBeNull()
            expect(result).toHaveLength(1)
            expect(result![0].type).toBe('XCUIElementTypeOther')
            expect(result![0].attributes.name).toBe('button-LOGIN')
        })

        test('findElementByXPathWithFallback returns element for ancestor XPath', () => {
            const result = findElementByXPathWithFallback(
                '//XCUIElementTypeStaticText[@name="LOGIN"]/ancestor::XCUIElementTypeOther[@name="button-LOGIN"]',
                PAGE_SOURCE_LOGIN_SCREEN
            )

            expect(result).not.toBeNull()
            expect(result!.element.type).toBe('XCUIElementTypeOther')
            expect(result!.element.attributes.name).toBe('button-LOGIN')
            expect(result!.matchCount).toBe(1)
        })
    })
})
