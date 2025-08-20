import path from 'node:path'
import { expect, describe, it, afterEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'
import { sanitizeHTML } from '../../../src/commands/element/getHTML.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('getHTML test', () => {
    it('should allow get html of an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo') as any
        elem.elementId = {
            outerHTML: '<some>outer html</some>',
            innerHTML: 'some inner html'
        }

        let result = await elem.getHTML()
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(result).toBe('<some>outer html</some>')

        result = await elem.getHTML({ includeSelectorTag: false })
        expect(result).toBe('some inner html')
    })

    describe('sanitizeHTML', () => {
        it('should remove simple HTML comments by default', () => {
            const html = '<!-- comment -->'
            const result = sanitizeHTML(html, { removeCommentNodes: true, prettify: false })
            expect(result).toBe('')
        })

        it('should remove comments with content around them', () => {
            const html = 'Hello <!-- comment --> World'
            const result = sanitizeHTML(html, { removeCommentNodes: true, prettify: false })
            expect(result).toBe('Hello  World')
        })

        it('should preserve comments when removeCommentNodes is false', () => {
            const html = 'Hello <!-- comment --> World'
            const result = sanitizeHTML(html, { removeCommentNodes: false, prettify: false })
            expect(result).toBe('Hello <!-- comment --> World')
        })

        it('should remove multiple comments', () => {
            const html = '<!-- start -->Text<!-- middle -->More<!-- end -->'
            const result = sanitizeHTML(html, { removeCommentNodes: true, prettify: false })
            expect(result).toBe('TextMore')
        })

        it('should handle framework-specific comments (e.g., Lit)', () => {
            const html = 'Content<!--?lit$206212805$--><!--?lit$206212805$-->After'
            const result = sanitizeHTML(html, { removeCommentNodes: true, prettify: false })
            expect(result).toBe('ContentAfter')
        })

        it('should handle multiline comments', () => {
            const html = `Text<!--
            multiline
            comment
            -->End`
            const result = sanitizeHTML(html, { removeCommentNodes: true, prettify: false })
            expect(result).toBe('TextEnd')
        })

        it('should handle multiline comments with various content', () => {
            const html = `<div>
                <!-- This is a comment
                     that spans multiple lines
                     and contains various content:
                     - List items
                     - Special chars: <>&'"
                     - Even code: function() { return true; }
                -->
                <p>Content</p>
            </div>`
            const result = sanitizeHTML(html, { removeCommentNodes: true, prettify: false })
            expect(result).not.toContain('<!--')
            expect(result).toContain('<p>Content</p>')
            expect(result).not.toContain('List items')
            expect(result).not.toContain('Special chars')
        })

        it('should handle multiple multiline comments', () => {
            const html = `Start
            <!--
                First multiline
                comment block
            -->
            Middle
            <!--
                Second multiline
                comment block
            -->
            End`
            const result = sanitizeHTML(html, { removeCommentNodes: true, prettify: false })
            expect(result.replace(/\s+/g, ' ').trim()).toBe('Start Middle End')
        })

        it('should handle multiline comments with nested HTML-like content', () => {
            const html = `<div>
                <!--
                    <div class="commented-out">
                        <p>This HTML is commented out</p>
                        <script>console.log('also commented')</script>
                    </div>
                -->
                <p>This is visible</p>
            </div>`
            const result = sanitizeHTML(html, { removeCommentNodes: true, prettify: false })
            expect(result).not.toContain('commented-out')
            expect(result).not.toContain('console.log')
            expect(result).toContain('<p>This is visible</p>')
        })

        it('should handle Windows-style line endings in multiline comments', () => {
            const html = 'Before<!--\r\nWindows\r\nstyle\r\ncomment\r\n-->After'
            const result = sanitizeHTML(html, { removeCommentNodes: true, prettify: false })
            expect(result).toBe('BeforeAfter')
        })

        it('should handle mixed line endings in multiline comments', () => {
            const html = 'Text<!--\nUnix line\r\nWindows line\rOld Mac line-->End'
            const result = sanitizeHTML(html, { removeCommentNodes: true, prettify: false })
            expect(result).toBe('TextEnd')
        })

        it('should handle multiline comments in Cheerio mode', async () => {
            const { load } = await import('cheerio')
            const html = `
                <html>
                    <body>
                        <!--
                            This is a multiline comment
                            in the document
                        -->
                        <div>
                            Content
                            <!--
                                Another multiline
                                comment inside div
                            -->
                        </div>
                    </body>
                </html>
            `
            const $ = load(html)
            const result = sanitizeHTML($, { removeCommentNodes: true, prettify: false })
            expect(result).not.toContain('<!--')
            expect(result).not.toContain('multiline comment')
            expect(result).toContain('<div>')
            expect(result).toContain('Content')
        })

        it('should handle comments with special characters', () => {
            const html = 'Before<!-- comment with <tags> & special chars -->After'
            const result = sanitizeHTML(html, { removeCommentNodes: true, prettify: false })
            expect(result).toBe('BeforeAfter')
        })

        it('should handle empty comments', () => {
            const html = 'Text<!---->More'
            const result = sanitizeHTML(html, { removeCommentNodes: true, prettify: false })
            expect(result).toBe('TextMore')
        })

        it('should not be vulnerable to ReDoS attacks', () => {
            // Create a string that could cause catastrophic backtracking in vulnerable regex
            const maliciousInput = '<!--' + 'a'.repeat(10000) + '-->' + '<!--' + 'b'.repeat(10000) + '-->'

            const startTime = Date.now()
            const result = sanitizeHTML(maliciousInput, { removeCommentNodes: true, prettify: false })
            const executionTime = Date.now() - startTime

            // Should complete quickly (under 50ms) even with malicious input
            expect(executionTime).toBeLessThan(50)
            // The simplified regex should handle it gracefully
            expect(result).not.toContain('<!--')
            expect(result).toBe('')
        })

        it('should handle nested comment-like structures', () => {
            // Note: In valid HTML, comments cannot be nested, but we should handle malformed input gracefully
            const html = '<!-- outer <!-- inner --> still in comment --> Text'
            const result = sanitizeHTML(html, { removeCommentNodes: true, prettify: false })
            expect(result).toBe(' still in comment --> Text')
        })

        it('should handle incomplete comments', () => {
            // Comments without closing tags should remain as-is (safer than trying to guess)
            const html = 'Text <!--incomplete comment'
            const result = sanitizeHTML(html, { removeCommentNodes: true, prettify: false })
            expect(result).toBe('Text <!--incomplete comment')
        })

        it('should remove comments in complex HTML when using Cheerio', async () => {
            // Import cheerio dynamically to test the Cheerio path
            const { load } = await import('cheerio')
            const complexHtml = `
                <div>
                    <!-- Comment 1 -->
                    <p>Text <!-- inline comment --> content</p>
                    <!-- Comment 2 -->
                    <span>More<!--comment-->text</span>
                </div>
            `
            const $ = load(complexHtml)
            const result = sanitizeHTML($, { removeCommentNodes: true, prettify: false })

            expect(result).not.toContain('<!--')
            expect(result).toContain('<p>Text  content</p>')
            expect(result).toContain('<span>Moretext</span>')
        })

        it('should exclude elements when specified', async () => {
            const { load } = await import('cheerio')
            const html = `
                <div>
                    <style>body { color: red; }</style>
                    <p>Keep this</p>
                    <script>console.log('remove')</script>
                </div>
            `
            const $ = load(html)
            const result = sanitizeHTML($, {
                excludeElements: ['style', 'script'],
                prettify: false
            })

            expect(result).not.toContain('<style>')
            expect(result).not.toContain('<script>')
            expect(result).toContain('<p>Keep this</p>')
        })

        it('should remove comments and exclude elements together', async () => {
            const { load } = await import('cheerio')
            const html = `
                <div>
                    <!-- Remove this comment -->
                    <style>/* CSS comment */</style>
                    <p>Keep this<!-- but not this --></p>
                </div>
            `
            const $ = load(html)
            const result = sanitizeHTML($, {
                removeCommentNodes: true,
                excludeElements: ['style'],
                prettify: false
            })

            expect(result).not.toContain('<!--')
            expect(result).not.toContain('<style>')
            expect(result).toContain('<p>Keep this</p>')
        })

        it('should handle comments at the beginning and end', () => {
            const html = '<!--start-->Middle<!--end-->'
            const result = sanitizeHTML(html, { removeCommentNodes: true, prettify: false })
            expect(result).toBe('Middle')
        })

        it('should handle consecutive comments', () => {
            const html = 'Text<!-- comment1 --><!-- comment2 --><!-- comment3 -->End'
            const result = sanitizeHTML(html, { removeCommentNodes: true, prettify: false })
            expect(result).toBe('TextEnd')
        })

        it('should handle HTML entities in comments', () => {
            const html = 'Text<!-- comment with &lt;entities&gt; -->End'
            const result = sanitizeHTML(html, { removeCommentNodes: true, prettify: false })
            expect(result).toBe('TextEnd')
        })
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
