import { expect, describe, it } from 'vitest'
import { androidButtonSelector, isMissingDialogError } from '../../src/utils/mobileDialog.js'

describe('androidButtonSelector', () => {
    it('builds a valid XPath for common button labels', () => {
        expect(androidButtonSelector('OK')).toBe('//android.widget.Button[@text="OK"]')
        expect(androidButtonSelector("Don't Allow")).toBe(
            '//android.widget.Button[@text="Don\'t Allow"]'
        )
    })
})

describe('isMissingDialogError', () => {
    it('matches W3C and Appium missing-element or missing-alert responses', () => {
        expect(isMissingDialogError(new Error('no such element'))).toBe(true)
        expect(isMissingDialogError(new Error('Unable to find an element with the given selector'))).toBe(true)
        expect(isMissingDialogError(new Error(
            'An element could not be located on the page using the given search parameters.'
        ))).toBe(true)
        expect(isMissingDialogError(new Error('no such alert'))).toBe(true)
    })

    it('matches errors that carry a WebDriver error code', () => {
        const err = Object.assign(new Error('something else'), { error: 'no such element' })
        expect(isMissingDialogError(err)).toBe(true)
    })

    it('does not match unrelated failures', () => {
        expect(isMissingDialogError(new Error('session expired'))).toBe(false)
        expect(isMissingDialogError(new Error('device disconnected'))).toBe(false)
        expect(isMissingDialogError('no such element')).toBe(false)
    })
})
