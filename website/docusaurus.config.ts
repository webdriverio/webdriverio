import url from 'node:url'
import path from 'node:path'

import { themes } from 'prism-react-renderer'
import remark from '@docusaurus/remark-plugin-npm2yarn'
import type { Config } from '@docusaurus/types'
import type { ThemeConfig } from '@docusaurus/preset-classic'
import './docusaurusVersions'
import pastVersions from './docusaurusVersions'
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
    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'throw',
    favicon: 'img/favicon.png',
    organizationName: 'webdriverio',
    projectName: 'webdriverio',
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
                label: 'API',
                position: 'left',
                docId: 'api',
            }, {
                to: 'blog', label: 'Blog', position: 'left'
            }, {
                type: 'doc',
                label: 'Contribute',
                position: 'left',
                docId: 'contribute',
            }, {
                to: '/community/support',
                label: 'Community',
                position: 'left',
                activeBaseRegex: '/community/'
            }, {
                type: 'doc',
                docId: 'sponsor',
                label: 'Sponsor',
                position: 'left'
            }, {
                label: 'v9',
                position: 'right',
                items: pastVersions.map(v => ({
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
                href: repoUrl,
                position: 'right',
                className: 'header-github-link',
                'aria-label': 'GitHub repository',
            }, {
                href: xUrl,
                position: 'right',
                className: 'header-twitter-link',
                'aria-label': '@webdriverio on 𝕏',
            }, {
                href: youtubeUrl,
                position: 'right',
                className: 'header-youtube-link',
                'aria-label': '@webdriverio on YouTube',
            }, {
                href: discordUrl,
                position: 'right',
                className: 'header-discord-link',
                'aria-label': 'Support Chat on Discord',
            }],
        },
        footer: {
            style: 'dark',
            links: [{
                title: 'Docs',
                items: [{
                    label: 'Getting Started',
                    to: 'docs/gettingstarted',
                }, {
                    label: 'API Reference',
                    to: 'docs/api',
                }, {
                    label: 'Contribute',
                    to: 'docs/contribute/',
                }, {
                    label: 'Help',
                    to: 'community/support',
                }],
            }, {
                title: 'Community',
                items: [{
                    label: 'Stack Overflow',
                    href: 'https://stackoverflow.com/questions/tagged/webdriver-io',
                }, {
                    label: 'Support Chat',
                    href: 'https://discord.webdriver.io',
                }, {
                    label: 'Slack',
                    href: 'https://seleniumhq.slack.com/join/shared_invite/zt-f7jwg1n7-RVw4v4sMA7Zjufira_~EVw#/'
                }, {
                    label: '𝕏',
                    href: 'https://x.com/webdriverio',
                }],
            }, {
                title: 'More',
                items: [{
                    label: 'Blog',
                    to: 'blog',
                }, {
                    label: 'Sponsor',
                    to: 'docs/sponsor',
                }, {
                    label: 'Swag Store',
                    href: 'https://shop.webdriver.io',
                }, {
                    label: 'YouTube',
                    href: youtubeUrl,
                }],
            }, {
                title: 'Sponsored by',
                items: [{
                    html: `
                      <a href="https://www.browserstack.com/automation-webdriverio" target="_blank" rel="noreferrer noopener" aria-label="Premium Sponsor BrowserStack">
                        <img src="/img/sponsors/browserstack_white.svg" alt="BrowserStack" />
                      </a>`
                }]
            }],
            logo: {
                alt: 'OpenJS Foundation Logo',
                src: 'https://raw.githubusercontent.com/openjs-foundation/artwork/main/openjs_foundation/openjs_foundation-logo-horizontal-color-dark_background.svg',
                href: 'https://openjsf.org/'
            },
            copyright: `Copyright © ${new Date().getFullYear()} OpenJS Foundation`,
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
                googleAnalytics: {
                    trackingID: 'UA-47063382-1',
                    anonymizeIP: true,
                },
            },
        ]
    ],
    plugins: [
        [
            'client-redirects',
            {
                fromExtensions: ['html'],
                /**
                 * v7 -> v8 doc redirects
                 */
                redirects: [{
                    from: '/docs/browserobject',
                    to: '/docs/api/browser'
                }, {
                    from: '/docs/options',
                    to: '/docs/configuration'
                }, {
                    from: '/docs/what-is-webdriverio',
                    to: '/docs/why-webdriverio'
                }, {
                    from: '/docs/sync-vs-async',
                    to: '/docs/gettingstarted'
                }, {
                    from: '/docs/clioptions',
                    to: '/docs/testrunner'
                }]
            }
        ],
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
            'pwa',
            {
                debug: false,
                offlineModeActivationStrategies: ['appInstalled', 'queryString'],
                // swRegister: false,
                swCustom: path.resolve(__dirname, 'src', 'sw.js'),
                pwaHead: [
                    {
                        tagName: 'link',
                        rel: 'icon',
                        href: 'img/logo-webdriver-io.png',
                    },
                    {
                        tagName: 'link',
                        rel: 'manifest',
                        href: '/manifest.json',
                    },
                    {
                        tagName: 'meta',
                        name: 'theme-color',
                        content: 'rgb(234, 90, 7)',
                    },
                    {
                        tagName: 'meta',
                        name: 'apple-mobile-web-app-capable',
                        content: 'yes',
                    },
                    {
                        tagName: 'meta',
                        name: 'apple-mobile-web-app-status-bar-style',
                        content: '#000',
                    },
                    {
                        tagName: 'link',
                        rel: 'apple-touch-icon',
                        href: 'img/logo-webdriver-io.png',
                    },
                    {
                        tagName: 'link',
                        rel: 'mask-icon',
                        href: 'img/logo-webdriver-io.svg',
                        color: 'rgb(234, 90, 7)',
                    },
                    {
                        tagName: 'meta',
                        name: 'msapplication-TileImage',
                        content: 'img/logo-webdriver-io.png',
                    },
                    {
                        tagName: 'meta',
                        name: 'msapplication-TileColor',
                        content: '#000',
                    },
                ],
            },
        ],
    ],
    themes: [path.resolve(__dirname, 'node_modules', 'docusaurus-theme-github-codeblock', 'build', 'index.js')],
    stylesheets: [
        'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;700&display=block',
        'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=block'
    ],
    scripts: [
        'https://unpkg.com/mermaid@8.5.1/dist/mermaid.min.js',
        'https://buttons.github.io/buttons.js',
        '/js/ribbons.js',
        '/js/flowchart.js'
    ]
}

export default config
