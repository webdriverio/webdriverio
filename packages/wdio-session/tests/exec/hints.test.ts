import { describe, it, expect } from 'vitest'

import { hintFor } from '../../src/exec/hints.js'

describe('exec hints', () => {
    it.each([
        ['browser.element is not a function', 'The v4 `browser.element(selector)` style was removed. Use `await $(selector)`.'],
        ['browser.elements is not a function', 'The v4 `browser.elements(selector)` style was removed. Use `await $$(selector)`.'],
        ['browser.click is not a function', 'The v4 `browser.click(selector)` style was removed. Use `await $(selector).click()`.'],
        ['browser.setValue is not a function', 'The v4 `browser.setValue(selector)` style was removed. Use `await $(selector).setValue()`.'],
        ['browser.getText is not a function', 'The v4 `browser.getText(selector)` style was removed. Use `await $(selector).getText()`.'],
        ['browser.waitForVisible is not a function', 'The v4 `browser.waitForVisible(selector)` style was removed. Use `await $(selector).waitForDisplayed()`.'],
        ['browser.waitForExist is not a function', 'The v4 `browser.waitForExist(selector)` style was removed. Use `await $(selector).waitForExist()`.'],
        ['browser.executeAsync is not a function', 'Removed in v10: use `browser.execute` with an async function.'],
        ['browser.touchAction is not a function', 'Removed in v10: use `browser.action(\'pointer\')` or mobile commands like `tap`/`swipe`.'],
        ['element ("h2") still not existing after 3000ms', 'Take a new `wdio session snapshot`; the page may have changed.']
    ])('%s', (message, hint) => {
        expect(hintFor({ message })).toBe(hint)
    })

    it('recognizes strict selector errors by name and message', () => {
        const hint = '`$` must match exactly one element in v10. Use `$$(selector)[0]`, a ref, or a narrower selector. Run `wdio session find "<text>"` to locate it.'
        expect(hintFor({ name: 'StrictSelectorError', message: 'x' })).toBe(hint)
        expect(hintFor({ message: 'strict mode violation: `$(li)` resolved to 3 elements, expected 1.' })).toBe(hint)
    })

    it('has no hint for other errors', () => {
        expect(hintFor({ message: 'boom' })).toBe(undefined)
        expect(hintFor({ message: 'browser.getTitle is not a function' })).toBe(undefined)
    })
})
