import url from 'node:url'
import path from 'node:path'

import { themes } from 'prism-react-renderer'
import remark from '@docusaurus/remark-plugin-npm2yarn'
import type { Config } from '@docusaurus/types'
import type { ThemeConfig } from '@docusaurus/preset-classic'
import versions, { currentVersion } from './docusaurusVersions'
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const organizationName = 'webdriverio' // Usually your GitHub org/user name.
const projectName = 'webdriverio' // Usually your repo name.
const branch = 'main'
const repoUrl = `https://github.com/${organizationName}/${projectName}`
const xUrl = `https://x.com/${projectName}`
const youtubeUrl = `https://youtube.com/@${projectName}`
const discordUrl = 'https://discord.webdriver.io/'
const wdioLogo = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNjRweCIgaGVpZ2h0PSI2NHB4IiB2aWV3Qm94PSIwIDAgNjQgNjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8dGl0bGU+TG9nbyBSZWd1bGFyPC90aXRsZT4KICAgIDxnIGlkPSJMb2dvLVJlZ3VsYXIiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxyZWN0IGlkPSJSZWN0YW5nbGUiIGZpbGw9IiNFQTU5MDYiIHg9IjAiIHk9IjAiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgcng9IjUiPjwvcmVjdD4KICAgICAgICA8cGF0aCBkPSJNOCwxNiBMOCw0OCBMNiw0OCBMNiwxNiBMOCwxNiBaIE00MywxNiBDNTEuODM2NTU2LDE2IDU5LDIzLjE2MzQ0NCA1OSwzMiBDNTksNDAuODM2NTU2IDUxLjgzNjU1Niw0OCA0Myw0OCBDMzQuMTYzNDQ0LDQ4IDI3LDQwLjgzNjU1NiAyNywzMiBDMjcsMjMuMTYzNDQ0IDM0LjE2MzQ0NCwxNiA0MywxNiBaIE0yNywxNiBMMTQuMTA2LDQ3Ljk5OTIwNzggTDExLjk5OSw0Ny45OTkyMDc4IEwyNC44OTQsMTYgTDI3LDE2IFogTTQzLDE4IEMzNS4yNjgwMTM1LDE4IDI5LDI0LjI2ODAxMzUgMjksMzIgQzI5LDM5LjczMTk4NjUgMzUuMjY4MDEzNSw0NiA0Myw0NiBDNTAuNzMxOTg2NSw0NiA1NywzOS43MzE5ODY1IDU3LDMyIEM1NywyNC4yNjgwMTM1IDUwLjczMTk4NjUsMTggNDMsMTggWiIgaWQ9IkNvbWJpbmVkLVNoYXBlIiBmaWxsPSIjRkZGRkZGIj48L3BhdGg+CiAgICA8L2c+Cjwvc3ZnPg=='
const mendableAnonKey = 'c4096c1b-8c46-4891-8ba2-5f0e2ef4fa81'

const config: Config = {
    title: 'WebdriverIO',
    tagline: 'Next-gen browser and mobile automation test framework for Node.js',
    url: 'https://webdriver.io',
    baseUrl: '/',
    /**
     * Leave `trailingSlash` unset: with `trailingSlash: false` Docusaurus writes
     * the `$$` command pages (e.g. /docs/api/browser/$$) to the `$` route.
     * Vercel serves `docs/foo/index.html` at `/docs/foo` either way.
     */
    onBrokenLinks: 'throw',
    future: {
        /**
         * Rspack, SWC and Lightning CSS instead of Webpack, Babel and cssnano.
         * Cuts the multi-locale production build time considerably.
         */
        faster: true,
        v4: {
            removeLegacyPostBuildHeadAttribute: true,
        },
    },
    favicon: 'img/favicon.png',
    organizationName: 'webdriverio',
    projectName: 'webdriverio',
    markdown: {
        mermaid: true,
        hooks: {
            onBrokenMarkdownLinks: 'throw',
        },
    },
    customFields: {
        repoUrl,
        mendableAnonKey
    },
    i18n: {
        defaultLocale: 'en',
        locales: [
            'en',
            'ar',
            'de',
            'es',
            // 'fa', => 3 backticks are added on line 5 which breaks the markdown parser
            'fr',
            'hi',
            'it',
            // 'ja', => links will break, they are also translated
            'ko',
            'pl',
            'pt',
            'ru',
            'sv',
            'ta',
            'uk',
            'vi',
            'zh',
        ],
    },
    themeConfig: {
        image: 'img/logo-webdriver-io.png',
        metadata: [{ name: 'twitter:card', content: 'summary' }],
        colorMode: {
            defaultMode: 'light',
            disableSwitch: false,
            respectPrefersColorScheme: true
        },
        prism: {
            theme: themes.github,
            darkTheme: themes.dracula
        },
        mermaid: {
            theme: { light: 'neutral', dark: 'dark' },
        },
        algolia: {
            apiKey: 'f86258c57f779a1358e0a9054aeadad5',
            indexName: 'webdriver',
            appId: '3G5CUKDJDE'
        },
        announcementBar: {
            id: 'supportus',
            content: '🇺🇦  &nbsp;We stand with the people of Ukraine. We encourage compassion, and hope for peace. &nbsp; 🇺🇦<br>Please support humanitarian efforts for the Ukraine crisis through the <a target="_blank" rel="noopener noreferrer" href="https://www.icrc.org/en/donate/ukraine">International Committee of the Red Cross</a>! #StandWithUkraine',
        },
        navbar: {
            // title: 'I/O',
            logo: {
                alt: 'WebdriverIO',
                src: wdioLogo,
                srcDark: wdioLogo,
            },
            items: [{
                type: 'doc',
                label: 'Docs',
                position: 'left',
                docId: 'gettingstarted',
            }, {
                type: 'doc',
                label: 'Reference',
                position: 'left',
                docId: 'api',
            }, {
                type: 'docSidebar',
                label: 'Ecosystem',
                position: 'left',
                sidebarId: 'ecosystem',
            }, {
                to: 'blog', label: 'Blog', position: 'left'
            }, {
                to: '/community/support',
                label: 'Community',
                position: 'left',
                activeBaseRegex: '/community/'
            }, {
                label: currentVersion.label,
                position: 'right',
                items: versions.map(v => ({
                    label: v.label,
                    href: v.path,
                    className: 'dropdown-version-item'
                }))
            }, {
                type: 'localeDropdown',
                position: 'right',
                dropdownItemsAfter: [{
                    type: 'html',
                    value: '<hr style="margin: 0.3rem 0;">',
                }, {
                    href: 'https://github.com/webdriverio/i18n#supported-languages',
                    label: 'Add your language',
                }]
            }, {
                href: discordUrl,
                position: 'right',
                className: 'header-discord-link',
                'aria-label': 'Support Chat on Discord',
            }, {
                href: repoUrl,
                position: 'right',
                className: 'header-github-link',
                'aria-label': 'GitHub repository',
            }, {
                type: 'doc',
                docId: 'sponsor',
                label: 'Sponsor',
                position: 'right',
                className: 'navbar-sponsor-button',
            }],
        },
        footer: {
            style: 'dark',
            links: [{
                title: 'Docs',
                items: [{
                    label: 'Getting Started',
                    to: '/docs/gettingstarted',
                }, {
                    label: 'AI Agents & MCP',
                    to: '/docs/mcp',
                }, {
                    label: 'Platforms',
                    to: '/docs/platforms/web',
                }, {
                    label: 'API Reference',
                    to: '/docs/api',
                }, {
                    label: 'Ecosystem',
                    to: '/docs/ecosystem',
                }],
            }, {
                title: 'Community',
                items: [{
                    label: 'Support',
                    to: '/community/support',
                }, {
                    label: 'Discord',
                    href: discordUrl,
                }, {
                    label: 'GitHub Discussions',
                    href: `${repoUrl}/discussions`,
                }, {
                    label: 'Stack Overflow',
                    href: 'https://stackoverflow.com/questions/tagged/webdriver-io',
                }, {
                    label: 'X',
                    href: xUrl,
                }, {
                    label: 'YouTube',
                    href: youtubeUrl,
                }],
            }, {
                title: 'Project',
                items: [{
                    label: 'Blog',
                    to: '/blog',
                }, {
                    label: 'Contribute',
                    to: '/docs/contribute',
                }, {
                    label: 'Governance',
                    href: `${repoUrl}/blob/main/GOVERNANCE.md`,
                }, {
                    label: 'Sponsor',
                    to: '/docs/sponsor',
                }, {
                    label: 'Swag Store',
                    href: 'https://shop.webdriver.io',
                }, {
                    label: 'llms.txt',
                    href: 'pathname:///llms.txt',
                }],
            }, {
                title: 'Sponsored by',
                items: [{
                    html: `
                      <a href="https://www.browserstack.com/automation-webdriverio" target="_blank" rel="noreferrer noopener" aria-label="Premium Sponsor BrowserStack">
                        <img src="/img/sponsors/browserstack_white.svg" alt="BrowserStack" />
                      </a>`
                }, {
                    html: `
                      <a href="https://momentic.ai/" target="_blank" rel="noreferrer noopener" aria-label="Premium Sponsor Momentic">
                        <img src="/img/sponsors/momentic_white.svg" alt="Momentic" />
                      </a>`
                }]
            }],
            logo: {
                alt: 'OpenJS Foundation Logo',
                src: 'https://raw.githubusercontent.com/openjs-foundation/artwork/main/openjs_foundation/openjs_foundation-logo-horizontal-color-dark_background.svg',
                href: 'https://openjsf.org/'
            },
            copyright: `
              <p>
                Copyright ${new Date().getFullYear()} <a href="https://openjsf.org">OpenJS Foundation</a> and WebdriverIO contributors. All rights reserved. The <a href="https://openjsf.org">OpenJS Foundation</a> has registered trademarks and uses trademarks. For a list of trademarks of the <a href="https://openjsf.org">OpenJS Foundation</a>, please see our <a href="https://trademark-policy.openjsf.org/">Trademark Policy</a> and <a href="https://trademark-list.openjsf.org/">Trademark List</a>. Trademarks and logos not indicated on the <a href="https://trademark-list.openjsf.org">list of OpenJS Foundation trademarks</a> are trademarks&trade; or registered&reg; trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them.
              </p>
              <p>
                <a href="https://openjsf.org/">The OpenJS Foundation</a> | <a href="https://terms-of-use.openjsf.org/">Terms of Use</a> | <a href="https://privacy-policy.openjsf.org/">Privacy Policy</a> | <a href="https://bylaws.openjsf.org/">Bylaws</a> | <a href="https://code-of-conduct.openjsf.org/">Code of Conduct</a> | <a href="https://trademark-policy.openjsf.org/">Trademark Policy</a> | <a href="https://trademark-list.openjsf.org/">Trademark List</a> | <a href="https://www.linuxfoundation.org/cookies/">Cookie Policy</a>
              </p>
            `,
        },
        codeblock: {
            showRunmeLink: true,
            runmeLinkLabel: 'Run Example'
        },
    } satisfies ThemeConfig,
    presets: [
        [
            'classic', {
                docs: {
                    sidebarPath: path.resolve(__dirname, 'sidebars.ts'),
                    // Please change this to your repo.
                    editUrl:`${repoUrl}/edit/${branch}/website/`,
                    remarkPlugins: [
                        [remark, { sync: true }],
                    ],
                    include: ['**/*.{md,mdx}', '**/_*.{md,mdx}'],
                    exclude: [
                        '**/*.test.{js,jsx,ts,tsx}',
                        '**/__tests__/**'
                    ]
                },
                blog: {
                    showReadingTime: true,
                    postsPerPage: 3,
                    blogSidebarCount: 7,
                    // Please change this to your repo.
                    editUrl: `${repoUrl}/edit/${branch}/website/blog/`,
                },
                theme: {
                    customCss: path.resolve(__dirname, 'src', 'css', 'custom.css'),
                },
                pages: {
                    remarkPlugins: [remark],
                },
                sitemap: {
                    /**
                     * emit <lastmod> so search engines and AI crawlers can tell
                     * which pages actually changed
                     */
                    lastmod: 'date',
                    changefreq: 'weekly',
                },
            },
        ]
    ],
    plugins: [
        [
            'content-docs',
            {
                id: 'community',
                path: 'community',
                editUrl: `https://github.com/${organizationName}/${projectName}/edit/${branch}/website/`,
                routeBasePath: 'community',
                sidebarPath: path.resolve(__dirname, 'sidebarsCommunity.ts')
            },
        ],
        'ideal-image',
        [
            '@signalwire/docusaurus-plugin-llms-txt',
            {
                /**
                 * emits `/llms.txt` (an annotated index of the docs), plus a
                 * clean Markdown twin for every page, e.g. `/docs/api/browser.md`.
                 * Without this, anything reading the site has to scrape the
                 * rendered HTML and strip the navbar, announcement bar and footer
                 * off every page.
                 */
                siteTitle: 'WebdriverIO',
                siteDescription: 'Next-gen browser and mobile automation test framework for Node.js',
                depth: 2,
                content: {
                    enableMarkdownFiles: true,
                    /**
                     * `/llms-full.txt` inlines the whole corpus into one file, for
                     * consumers that would otherwise crawl every page individually
                     */
                    enableLlmsFullTxt: true,
                    /**
                     * docs only for now. Whether the blog and community pages
                     * should be included too is still an open question
                     */
                    includeDocs: true,
                    includeBlog: false,
                    includePages: false,
                    excludeRoutes: [
                        '/search',
                        '/404',
                    ],
                },
            },
        ],
    ],
    clientModules: [
        path.resolve(__dirname, 'src', 'clientModules', 'vercelAnalytics.ts'),
    ],
    themes: [
        path.resolve(__dirname, 'node_modules', 'docusaurus-theme-github-codeblock', 'build', 'index.js'),
        '@docusaurus/theme-mermaid',
    ],
    headTags: [
        { tagName: 'link', attributes: { rel: 'manifest', href: '/manifest.json' } },
        { tagName: 'meta', attributes: { name: 'theme-color', content: 'rgb(234, 90, 7)' } },
        { tagName: 'link', attributes: { rel: 'apple-touch-icon', href: '/img/logo-webdriver-io.png' } },
    ],
    stylesheets: [
        'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;700&display=block',
        'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=block'
    ],
    scripts: [
        'https://buttons.github.io/buttons.js',
        '/js/ribbons.js'
    ]
}

export default config
