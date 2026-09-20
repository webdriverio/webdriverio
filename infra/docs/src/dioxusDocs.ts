import { generateDesktopServiceDocs, type DesktopDocsConfig } from './desktopDocs.js'
import type { PageProps } from './docsUtils.js'
import { getRootDir } from '@wdio/repo-utils'

/**
 * Source files in `packages/dioxus-service/docs/` of the wdio-desktop-mobile
 * monorepo, keyed by the docusaurus `id` they should be published under.
 */
export const DIOXUS_DOCS: Record<string, PageProps> = {
    'quick-start': { sourcePath: 'quick-start.md', title: 'Quick Start' },
    configuration: { sourcePath: 'configuration.md', title: 'Configuration' },
    api: { sourcePath: 'api-reference.md', title: 'API Reference' },
    'plugin-setup': { sourcePath: 'plugin-setup.md', title: 'Bridge Setup' },
    'platform-support': { sourcePath: 'platform-support.md', title: 'Platform Support' },
    'usage-examples': { sourcePath: 'usage-examples.md', title: 'Usage Examples' },
    'browser-mode': { sourcePath: 'browser-mode.md', title: 'Browser Mode' },
    'log-forwarding': { sourcePath: 'log-forwarding.md', title: 'Log Forwarding' },
    'edge-webdriver-windows': { sourcePath: 'edge-webdriver-windows.md', title: 'Edge WebDriver on Windows' },
    'deeplink-testing': { sourcePath: 'deeplink-testing.md', title: 'Deeplink Testing' },
    coexistence: { sourcePath: 'coexistence.md', title: 'Coexistence' },
    troubleshooting: { sourcePath: 'troubleshooting.md', title: 'Troubleshooting' }
}

export const DIOXUS_DOCS_CONFIG: DesktopDocsConfig = {
    allDocs: DIOXUS_DOCS,
    githubRepo: 'webdriverio/desktop-mobile',
    docsSha: '34f791f7984e1a32e816251f318ee64e48c23cf6',
    docsSourceDir: 'packages/dioxus-service/docs',
    websiteDocsPath: ['website', 'docs', 'desktop-testing', 'dioxus'],
    publishedUrlPrefix: '/docs/desktop-testing/dioxus',
    transformContent: (content, helpers) => (
        // Any relative link rewriteLinks() didn't resolve — a sibling package README, a
        // source file (../../native-types/src/….ts), or a doc we don't publish — can't
        // resolve in the site and fails both the MDX build and Docusaurus' broken-link
        // check. Point it at GitHub instead. (In-doc links were already rewritten to
        // absolute /docs/… paths above, so they no longer start with ./ or ../.)
        content.replace(
            /(\]\()((?:\.\.?\/)[^)\s#]+)((?:#[\w-]+)?)(\))/g,
            (_match, open: string, relativePath: string, anchor: string, close: string) =>
                `${open}${helpers.resolveRepoBlobUrl(relativePath)}${anchor}${close}`
        )
    ),
    transformLine: (line, inCodeBlock) => {
        if (inCodeBlock) {
            return line
        }
        return line
            // Standalone component-like tags, e.g. <Result>.
            .replace(/<([A-Z][a-zA-Z0-9]+)>/g, '\\<$1>')
            // Type generics, e.g. Record<string, string> or Array<T> — the identifier
            // before `<` distinguishes them from real tags like <br> or <img …>.
            .replace(/([A-Za-z0-9_\]])<(?=[A-Za-z])/g, '$1\\<')
    }
}

export async function generateDioxusDocs (rootDir = getRootDir()) {
    return generateDesktopServiceDocs(DIOXUS_DOCS_CONFIG, rootDir)
}
