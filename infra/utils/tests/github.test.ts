import { describe, it, expect, vi, afterEach } from 'vitest'

import { downloadFromGitHub } from '../src/github.js'

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('downloadFromGitHub', () => {
    it('rewrites github.com URLs to raw.githubusercontent.com and defaults to README.md', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            text: async () => '# hello'
        })
        vi.stubGlobal('fetch', fetchMock)

        const content = await downloadFromGitHub('https://github.com/webdriverio/webdriverio', 'main')

        expect(content).toBe('# hello')
        expect(fetchMock).toHaveBeenCalledWith(
            'https://raw.githubusercontent.com/webdriverio/webdriverio/main//README.md'
        )
    })

    it('keeps raw.githubusercontent.com URLs and honors a custom location', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            text: async () => 'docs'
        })
        vi.stubGlobal('fetch', fetchMock)

        await downloadFromGitHub(
            'https://raw.githubusercontent.com/webdriverio/desktop-mobile',
            'abc123',
            'packages/electron-service/docs/api.md'
        )

        expect(fetchMock).toHaveBeenCalledWith(
            'https://raw.githubusercontent.com/webdriverio/desktop-mobile/abc123/packages/electron-service/docs/api.md'
        )
    })
})
