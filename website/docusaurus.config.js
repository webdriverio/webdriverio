const path = require('node:path')

const organizationName = 'webdriverio' // Usually your GitHub org/user name.
const projectName = 'webdriverio' // Usually your repo name.
const branch = 'main'
const repoUrl = `https://github.com/${organizationName}/${projectName}`
const twitterUrl = `https://twitter.com/${projectName}`
const wdioLogo = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNjRweCIgaGVpZ2h0PSI2NHB4IiB2aWV3Qm94PSIwIDAgNjQgNjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8dGl0bGU+TG9nbyBSZWd1bGFyPC90aXRsZT4KICAgIDxnIGlkPSJMb2dvLVJlZ3VsYXIiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxyZWN0IGlkPSJSZWN0YW5nbGUiIGZpbGw9IiNFQTU5MDYiIHg9IjAiIHk9IjAiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgcng9IjUiPjwvcmVjdD4KICAgICAgICA8cGF0aCBkPSJNOCwxNiBMOCw0OCBMNiw0OCBMNiwxNiBMOCwxNiBaIE00MywxNiBDNTEuODM2NTU2LDE2IDU5LDIzLjE2MzQ0NCA1OSwzMiBDNTksNDAuODM2NTU2IDUxLjgzNjU1Niw0OCA0Myw0OCBDMzQuMTYzNDQ0LDQ4IDI3LDQwLjgzNjU1NiAyNywzMiBDMjcsMjMuMTYzNDQ0IDM0LjE2MzQ0NCwxNiA0MywxNiBaIE0yNywxNiBMMTQuMTA2LDQ3Ljk5OTIwNzggTDExLjk5OSw0Ny45OTkyMDc4IEwyNC44OTQsMTYgTDI3LDE2IFogTTQzLDE4IEMzNS4yNjgwMTM1LDE4IDI5LDI0LjI2ODAxMzUgMjksMzIgQzI5LDM5LjczMTk4NjUgMzUuMjY4MDEzNSw0NiA0Myw0NiBDNTAuNzMxOTg2NSw0NiA1NywzOS43MzE5ODY1IDU3LDMyIEM1NywyNC4yNjgwMTM1IDUwLjczMTk4NjUsMTggNDMsMTggWiIgaWQ9IkNvbWJpbmVkLVNoYXBlIiBmaWxsPSIjRkZGRkZGIj48L3BhdGg+CiAgICA8L2c+Cjwvc3ZnPg=='

module.exports = {
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
        repoUrl
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
            theme: require('prism-react-renderer/themes/github'),
            darkTheme: require('prism-react-renderer/themes/dracula')
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
                label: 'v8',
                position: 'right',
                to: '/versions'
            }, {
                href: repoUrl,
                position: 'right',
                className: 'header-github-link',
                'aria-label': 'GitHub repository',
            }, {
                href: twitterUrl,
                position: 'right',
                className: 'header-twitter-link',
                'aria-label': '@webdriverio on Twitter',
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
                    href: 'https://matrix.to/#/#webdriver.io:gitter.im',
                }, {
                    label: 'Slack',
                    href: 'https://seleniumhq.slack.com/join/shared_invite/zt-f7jwg1n7-RVw4v4sMA7Zjufira_~EVw#/'
                }, {
                    label: 'Twitter',
                    href: 'https://twitter.com/webdriverio',
                }],
            }, {
                title: 'More',
                items: [{
                    label: 'Tidelift Subscription',
                    to: 'https://webdriver.io/docs/enterprise.html',
                }, {
                    label: 'Donate to WebdriverIO',
                    href: 'https://opencollective.com/webdriverio',
                }, {
                    label: 'Swag Store',
                    href: 'http://shop.webdriver.io',
                }, {
                    label: 'Blog',
                    to: 'blog',
                }, {
                    label: 'GitHub',
                    href: repoUrl,
                }],
            }],
            logo: {
                alt: 'OpenJS Foundation Logo',
                src: '/img/open-jsf-logo.svg',
                href: 'https://openjsf.org/'
            },
            copyright: `Copyright © ${new Date().getFullYear()} OpenJS Foundation`,
        },
        codeblock: {
            showRunmeLink: true,
            runmeLinkLabel: 'Run Example'
        },
    },
    presets: [
        [
            '@docusaurus/preset-classic', {
                docs: {
                    sidebarPath: require.resolve('./sidebars.js'),
                    // Please change this to your repo.
                    editUrl:`${repoUrl}/edit/${branch}/website/`,
                    remarkPlugins: [
                        [require('@docusaurus/remark-plugin-npm2yarn'), { sync: true }],
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
                    customCss: require.resolve('./src/css/custom.css'),
                },
                pages: {
                    remarkPlugins: [require('@docusaurus/remark-plugin-npm2yarn')],
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
            '@docusaurus/plugin-client-redirects',
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
            '@docusaurus/plugin-content-docs',
            {
                id: 'community',
                path: 'community',
                editUrl: `https://github.com/${organizationName}/${projectName}/edit/${branch}/website/`,
                routeBasePath: 'community',
                sidebarPath: require.resolve('./sidebarsCommunity.js')
            },
        ],
        '@docusaurus/plugin-ideal-image',
        [
            '@docusaurus/plugin-pwa',
            {
                debug: false,
                offlineModeActivationStrategies: ['appInstalled', 'queryString'],
                // swRegister: false,
                swCustom: path.resolve(__dirname, 'src/sw.js'),
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
    themes: ['docusaurus-theme-github-codeblock'],
    stylesheets: [
        'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;700&display=block',
        'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=block'
    ],
    scripts: [
        'https://buttons.github.io/buttons.js',
        '/js/ribbons.js'
    ]
}
