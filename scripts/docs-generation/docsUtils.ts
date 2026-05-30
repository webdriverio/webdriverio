export interface PageProps {
    sourcePath: string
    title: string
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
