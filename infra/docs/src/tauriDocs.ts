import { generateDesktopServiceDocs, type DesktopDocsConfig } from './desktopDocs.js'
import type { PageProps } from './docsUtils.js'
import { getRootDir } from '@wdio/repo-utils'

/**
 * Source files in `packages/tauri-service/docs/` of the wdio-desktop-mobile
 * monorepo, keyed by the docusaurus `id` they should be published under.
 */
export const TAURI_DOCS: Record<string, PageProps> = {
    'quick-start': { sourcePath: 'quick-start.md', title: 'Quick Start' },
    configuration: { sourcePath: 'configuration.md', title: 'Configuration' },
    api: { sourcePath: 'api-reference.md', title: 'API Reference' },
    'plugin-setup': { sourcePath: 'plugin-setup.md', title: 'Plugin Setup' },
    'platform-support': { sourcePath: 'platform-support.md', title: 'Platform Support' },
    'usage-examples': { sourcePath: 'usage-examples.md', title: 'Usage Examples' },
    'log-forwarding': { sourcePath: 'log-forwarding.md', title: 'Log Forwarding' },
    'edge-webdriver-windows': { sourcePath: 'edge-webdriver-windows.md', title: 'Edge WebDriver on Windows' },
    'deeplink-testing': { sourcePath: 'deeplink-testing.md', title: 'Deeplink Testing' },
    'crabnebula-setup': { sourcePath: 'crabnebula-setup.md', title: 'CrabNebula Setup' },
    troubleshooting: { sourcePath: 'troubleshooting.md', title: 'Troubleshooting' }
}

export const TAURI_DOCS_CONFIG: DesktopDocsConfig = {
    allDocs: TAURI_DOCS,
    githubRepo: 'webdriverio/desktop-mobile',
    docsSha: '37081c940a4528df3bf1994d9a5391d33a8775d5',
    docsSourceDir: 'packages/tauri-service/docs',
    websiteDocsPath: ['website', 'docs', 'desktop-testing', 'tauri'],
    publishedUrlPrefix: '/docs/desktop-testing/tauri',
    transformLine: (line, inCodeBlock) => {
        if (inCodeBlock) {
            return line
        }
        // Escape TypeScript generic angle brackets in plain text to prevent MDX parse errors
        return line.replace(/<([A-Z][a-zA-Z0-9]+)>/g, '\\<$1>')
    }
}

export async function generateTauriDocs (rootDir = getRootDir()) {
    return generateDesktopServiceDocs(TAURI_DOCS_CONFIG, rootDir)
}
