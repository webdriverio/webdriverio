export interface PageProps {
    sourcePath: string
    title: string
}

/**
 * HTML void elements that must be self-closing in MDX/JSX.
 * External READMEs often use HTML5 syntax (`<img>`, `<br>`) which breaks Docusaurus.
 */
const VOID_HTML_ELEMENTS = [
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
] as const

/**
 * Normalize void HTML tags for MDX compilation (e.g. `<img>` → `<img />`).
 */
export function sanitizeHtmlForMdx (content: string): string {
    let result = content

    for (const tag of VOID_HTML_ELEMENTS) {
        result = result.replace(new RegExp(`</${tag}\\s*>`, 'gi'), '')
    }

    for (const tag of VOID_HTML_ELEMENTS) {
        result = result.replace(
            new RegExp(`<${tag}(\\s[^>]*?)?(?<!/)>`, 'gi'),
            (_match, attrs: string | undefined) => `<${tag}${attrs ?? ''} />`
        )
    }

    return result
}

/**
 * Build a regex/replace function that turns the monorepo's relative markdown
 * links (e.g. `./configuration.md`, `./api.md#mocking`) into Docusaurus URLs.
 */
export function buildLinkRewriter(allDocs: Record<string, PageProps>, publishedUrlPrefix: string) {
    const filenameToId = new Map<string, string>()
    for (const [id, { sourcePath }] of Object.entries(allDocs)) {
        filenameToId.set(sourcePath, id)
    }
    return (content: string): string => content.replace(
        /\.\/([\w-]+\.md)(#[\w-]+)?/g,
        (match, filename: string, anchor: string | undefined) => {
            const id = filenameToId.get(filename)
            if (!id) {
                return match
            }
            return `${publishedUrlPrefix}/${id}${anchor ?? ''}`
        }
    )
}
