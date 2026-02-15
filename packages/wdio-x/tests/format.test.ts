import { describe, expect, it } from 'vitest'

import {
    formatBrowserElement,
    formatMobileElement,
    formatAccessibilityNode,
    formatSessionList,
} from '../src/format.js'

import type {
    BrowserElementFormatInput,
    MobileElementFormatInput,
    A11yNodeFormatInput,
    SessionListEntry,
} from '../src/format.js'

describe('formatBrowserElement', () => {
    it('should format a button with text content', () => {
        const el: BrowserElementFormatInput = {
            tagName: 'button',
            textContent: 'Submit Form',
            cssSelector: 'form > button.primary',
        }
        const result = formatBrowserElement('e1', el)
        expect(result).toContain('e1')
        expect(result).toContain('button')
        expect(result).toContain('"Submit Form"')
        expect(result).toContain('form > button.primary')
    })

    it('should format an input with type suffix and placeholder', () => {
        const el: BrowserElementFormatInput = {
            tagName: 'input',
            type: 'email',
            placeholder: 'Enter your email',
            cssSelector: '#email-input',
        }
        const result = formatBrowserElement('e2', el)
        expect(result).toContain('e2')
        expect(result).toContain('input[email]')
        expect(result).toContain('Enter your email')
        expect(result).toContain('#email-input')
    })

    it('should format a link with href using -> prefix', () => {
        const el: BrowserElementFormatInput = {
            tagName: 'a',
            href: 'https://example.com/about',
            cssSelector: 'nav a.about-link',
        }
        const result = formatBrowserElement('e3', el)
        expect(result).toContain('e3')
        expect(result).toContain('a')
        expect(result).toContain('-> https://example.com/about')
        expect(result).toContain('nav a.about-link')
    })

    it('should prioritize textContent over placeholder, ariaLabel, name, href', () => {
        const el: BrowserElementFormatInput = {
            tagName: 'a',
            textContent: 'Click me',
            placeholder: 'ignored',
            ariaLabel: 'ignored',
            name: 'ignored',
            href: 'https://ignored.com',
            cssSelector: 'a.link',
        }
        const result = formatBrowserElement('e4', el)
        expect(result).toContain('"Click me"')
        // href should still appear since it uses -> prefix, but textContent takes the descriptive slot
        // The link text is shown, not the placeholder/ariaLabel/name
        expect(result).not.toContain('"ignored"')
    })

    it('should fall back to ariaLabel when no textContent or placeholder', () => {
        const el: BrowserElementFormatInput = {
            tagName: 'div',
            ariaLabel: 'Close dialog',
            cssSelector: 'div.close-btn',
        }
        const result = formatBrowserElement('e5', el)
        expect(result).toContain('Close dialog')
    })

    it('should fall back to name when no textContent, placeholder, or ariaLabel', () => {
        const el: BrowserElementFormatInput = {
            tagName: 'input',
            type: 'text',
            name: 'username',
            cssSelector: 'input[name=username]',
        }
        const result = formatBrowserElement('e6', el)
        expect(result).toContain('username')
    })

    it('should left-align ref padded to 4 chars', () => {
        const el: BrowserElementFormatInput = {
            tagName: 'span',
            textContent: 'hi',
            cssSelector: 'span',
        }
        const result = formatBrowserElement('e1', el)
        // "e1" is 2 chars, should be padded to at least 4
        expect(result.startsWith('e1  ')).toBe(true)
    })

    it('should truncate long text content', () => {
        const longText = 'A'.repeat(200)
        const el: BrowserElementFormatInput = {
            tagName: 'p',
            textContent: longText,
            cssSelector: 'p',
        }
        const result = formatBrowserElement('e7', el)
        expect(result).toContain('...')
        expect(result.length).toBeLessThan(longText.length + 50)
    })
})

describe('formatMobileElement', () => {
    it('should format an iOS element with accessibility-id', () => {
        const el: MobileElementFormatInput = {
            tagName: 'XCUIElementTypeButton',
            text: 'Submit',
            selector: '~submit-btn',
            accessibilityId: 'submit-btn',
        }
        const result = formatMobileElement('m1', el)
        expect(result).toContain('m1')
        expect(result).toContain('XCUIElementTypeButton')
        expect(result).toContain('"Submit"')
        expect(result).toContain('[accessibility-id: submit-btn]')
    })

    it('should format element with resourceId', () => {
        const el: MobileElementFormatInput = {
            tagName: 'android.widget.EditText',
            text: 'Enter name',
            selector: 'android=new UiSelector().resourceId("name-input")',
            resourceId: 'name-input',
        }
        const result = formatMobileElement('m2', el)
        expect(result).toContain('m2')
        expect(result).toContain('android.widget.EditText')
        expect(result).toContain('"Enter name"')
        expect(result).toContain('[resource-id: name-input]')
    })

    it('should pad tag to 28 chars', () => {
        const el: MobileElementFormatInput = {
            tagName: 'Button',
            selector: '~btn',
        }
        const result = formatMobileElement('m3', el)
        // After ref (4 chars), tag "Button" should be padded to 28 chars
        const afterRef = result.slice(4) // skip ref
        // The tag portion should occupy 28 chars
        expect(afterRef.length).toBeGreaterThanOrEqual(28)
    })

    it('should show selector when no accessibilityId or resourceId', () => {
        const el: MobileElementFormatInput = {
            tagName: 'XCUIElementTypeStaticText',
            text: 'Hello',
            selector: '//XCUIElementTypeStaticText[@name="Hello"]',
        }
        const result = formatMobileElement('m4', el)
        expect(result).toContain('"Hello"')
        // Should show the raw selector in brackets
        expect(result).toContain('//XCUIElementTypeStaticText[@name="Hello"]')
    })
})

describe('formatAccessibilityNode', () => {
    it('should format a heading with level and name', () => {
        const node: A11yNodeFormatInput = {
            role: 'heading',
            name: 'Welcome',
            level: 1,
        }
        const result = formatAccessibilityNode('a1', node)
        expect(result).toContain('a1')
        expect(result).toContain('heading[1]')
        expect(result).toContain('"Welcome"')
    })

    it('should format a node without level', () => {
        const node: A11yNodeFormatInput = {
            role: 'button',
            name: 'Submit',
        }
        const result = formatAccessibilityNode('a2', node)
        expect(result).toContain('a2')
        expect(result).toContain('button')
        expect(result).not.toContain('[')
        expect(result).toContain('"Submit"')
    })

    it('should show required state', () => {
        const node: A11yNodeFormatInput = {
            role: 'textbox',
            name: 'Email',
            required: 'true',
        }
        const result = formatAccessibilityNode('a3', node)
        expect(result).toContain('required')
    })

    it('should show disabled state', () => {
        const node: A11yNodeFormatInput = {
            role: 'button',
            name: 'Save',
            disabled: 'true',
        }
        const result = formatAccessibilityNode('a4', node)
        expect(result).toContain('disabled')
    })

    it('should show checked state', () => {
        const node: A11yNodeFormatInput = {
            role: 'checkbox',
            name: 'Agree to terms',
            checked: 'true',
        }
        const result = formatAccessibilityNode('a5', node)
        expect(result).toContain('checked')
    })

    it('should show multiple states', () => {
        const node: A11yNodeFormatInput = {
            role: 'textbox',
            name: 'Username',
            required: 'true',
            disabled: 'true',
        }
        const result = formatAccessibilityNode('a6', node)
        expect(result).toContain('required')
        expect(result).toContain('disabled')
    })
})

describe('formatSessionList', () => {
    it('should format a table with entries', () => {
        const entries: SessionListEntry[] = [
            { name: 'default', browser: 'chrome', url: 'https://example.com', status: 'active' },
            { name: 'mobile', browser: 'safari', url: 'https://test.io', status: 'idle' },
        ]
        const result = formatSessionList(entries)
        expect(result).toContain('NAME')
        expect(result).toContain('BROWSER')
        expect(result).toContain('URL')
        expect(result).toContain('STATUS')
        expect(result).toContain('default')
        expect(result).toContain('chrome')
        expect(result).toContain('https://example.com')
        expect(result).toContain('active')
        expect(result).toContain('mobile')
        expect(result).toContain('safari')
        expect(result).toContain('https://test.io')
        expect(result).toContain('idle')
    })

    it('should return "No active sessions." for empty array', () => {
        const result = formatSessionList([])
        expect(result).toBe('No active sessions.')
    })

    it('should pad columns for alignment', () => {
        const entries: SessionListEntry[] = [
            { name: 'a', browser: 'chrome', url: 'https://x.com', status: 'active' },
        ]
        const result = formatSessionList(entries)
        const lines = result.split('\n')
        // Header and at least one data row
        expect(lines.length).toBeGreaterThanOrEqual(2)
        // All lines should have consistent column positions
        const headerNameEnd = lines[0].indexOf('BROWSER')
        const dataNameEnd = lines[1].indexOf('chrome')
        expect(headerNameEnd).toBe(dataNameEnd)
    })
})
