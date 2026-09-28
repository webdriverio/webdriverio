import { generateDesktopServiceDocs, type DesktopDocsConfig } from './desktopDocs.js'
import type { PageProps } from './docsUtils.js'
import { getRootDir } from '@wdio/repo-utils'

/**
 * Source files in `packages/electron-service/docs/` of the wdio-desktop-mobile
 * monorepo, keyed by the docusaurus `id` they should be published under.
 */
export const ELECTRON_DOCS: Record<string, PageProps> = {
    configuration: { sourcePath: 'configuration.md', title: 'Configuration' },
    api: { sourcePath: 'electron-apis.md', title: 'Accessing Electron APIs' },
    'api-reference': { sourcePath: 'api-reference.md', title: 'API Reference' },
    'standalone': { sourcePath: 'standalone-mode.md', title: 'Standalone Mode' },
    'window-management': { sourcePath: 'window-management.md', title: 'Window Management' },
    'deeplink-testing': { sourcePath: 'deeplink-testing.md', title: 'Deeplink Testing' },
    debugging: { sourcePath: 'debugging.md', title: 'Debugging' },
    'common-issues': { sourcePath: 'common-issues.md', title: 'Common Issues' }
}

export const ELECTRON_DOCS_CONFIG: DesktopDocsConfig = {
    allDocs: ELECTRON_DOCS,
    githubRepo: 'webdriverio/desktop-mobile',
    docsSha: '37081c940a4528df3bf1994d9a5391d33a8775d5',
    docsSourceDir: 'packages/electron-service/docs',
    websiteDocsPath: ['website', 'docs', 'desktop-testing', 'electron'],
    publishedUrlPrefix: '/docs/desktop-testing/electron'
}

export async function generateElectronDocs (rootDir = getRootDir()) {
    return generateDesktopServiceDocs(ELECTRON_DOCS_CONFIG, rootDir)
}
