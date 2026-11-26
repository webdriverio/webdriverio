import { afterEach, describe, inject, test, vi } from 'vitest'

import { todoLabel } from './helper.js'

vi.mock('./helper.js', () => ({
    todoLabel: vi.fn(() => 'mocked label')
}))

describe('mocking', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    test('replaces a helper', async ({ expect }) => {
        expect(todoLabel(2)).toBe('mocked label')
    })

    test('spies on a browser command', async ({ expect }) => {
        const getTitle = vi.spyOn(browser, 'getTitle')
        await browser.url(inject('baseUrl'))
        await browser.getTitle()
        expect(getTitle).toHaveBeenCalledTimes(1)
    })
})
