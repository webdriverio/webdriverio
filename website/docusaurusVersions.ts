export interface DocsVersion {
    name: string
    label: string
    path: string
    comment: string
    repoUrl: string
    branch: string
    current?: boolean
}

/**
 * Only the current and the previous major version are hosted. Older version
 * sites (v4 - v8) are redirected to webdriver.io, see `vercel.json`.
 */
const versions: DocsVersion[] = [
    {
        name: 'v10',
        label: 'v10',
        path: 'https://webdriver.io',
        comment: 'Stable',
        repoUrl: 'https://github.com/webdriverio/webdriverio',
        branch: 'main',
        current: true
    },
    {
        name: 'v9',
        label: 'v9',
        path: 'https://v9.webdriver.io',
        comment: 'Maintenance',
        repoUrl: 'https://github.com/webdriverio/webdriverio',
        branch: 'v9'
    }
]

export const currentVersion = versions.find((v) => v.current)!

export default versions
