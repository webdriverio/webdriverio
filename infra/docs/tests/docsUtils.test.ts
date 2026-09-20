import { describe, it, expect } from 'vitest'

import { sanitizeHtmlForMdx, buildLinkRewriter, type PageProps } from '../src/docsUtils.js'

describe('sanitizeHtmlForMdx', () => {
    it('self-closes void HTML tags and drops their closing tags', () => {
        expect(sanitizeHtmlForMdx('<img src="a.png"><br><hr></hr>')).toBe(
            '<img src="a.png" /><br /><hr />'
        )
    })

    it('leaves already self-closed tags alone', () => {
        expect(sanitizeHtmlForMdx('<img src="a.png" />')).toBe('<img src="a.png" />')
    })

    it('leaves non-void tags unchanged', () => {
        expect(sanitizeHtmlForMdx('<div class="x">hi</div>')).toBe('<div class="x">hi</div>')
    })
})

describe('buildLinkRewriter', () => {
    const allDocs: Record<string, PageProps> = {
        configuration: { sourcePath: 'configuration.md', title: 'Configuration' },
        api: { sourcePath: 'api-reference.md', title: 'API' }
    }
    const rewrite = buildLinkRewriter(allDocs, '/docs/desktop-testing/electron')

    it('rewrites known relative markdown links including anchors', () => {
        expect(rewrite('See [config](./configuration.md#mocking)')).toBe(
            'See [config](/docs/desktop-testing/electron/configuration#mocking)'
        )
        expect(rewrite('See [api](./api-reference.md)')).toBe(
            'See [api](/docs/desktop-testing/electron/api)'
        )
    })

    it('leaves unknown relative links untouched', () => {
        expect(rewrite('See [other](./missing.md)')).toBe('See [other](./missing.md)')
    })
})
