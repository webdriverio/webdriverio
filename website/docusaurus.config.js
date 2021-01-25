const organizationName = 'webdriverio' // Usually your GitHub org/user name.
const projectName = 'webdriverio' // Usually your repo name.
const branch = 'cb-v7-website' // ToDo(Christian): switch to "master" once deployed to prod

module.exports = {
    title: 'WebdriverIO',
    tagline: 'Next-gen browser and mobile automation test framework for Node.js',
    url: 'https://webdriver.io',
    baseUrl: '/',
    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'throw',
    favicon: 'img/favicon.png',
    organizationName,
    projectName,
    themeConfig: {
        colorMode: {
            defaultMode: 'light',
            disableSwitch: false,
            respectPrefersColorScheme: true,
            switchConfig: {
                darkIcon: '🌜',
                lightIcon: '☀️',
                // React inline style object
                // see https://reactjs.org/docs/dom-elements.html#style
                darkIconStyle: {
                    marginLeft: '2px',
                },
                lightIconStyle: {
                    marginLeft: '1px',
                },
            },
        },
        prism: {
            theme: require('prism-react-renderer/themes/github'),
            darkTheme: require('prism-react-renderer/themes/dracula')
        },
        googleAnalytics: {
            trackingID: 'UA-47063382-1'
        },
        algolia: {
            apiKey: '1b22fa823f22b7916528edc0e36d9d4a',
            indexName: 'webdriver',
            appId: 'BH4D9OD16A'
        },
        announcementBar: {
            id: 'supportus',
            content:
              `⭐️  &nbsp; If you like WebdriverIO, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/${organizationName}/${projectName}">GitHub</a>! ⭐️`,
        },
        navbar: {
            // title: 'I/O',
            logo: {
                alt: 'WebdriverIO',
                src: 'img/logo-webdriver-io.svg',
                srcDark: 'img/logo-webdriver-io.svg',
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
                label: 'Versions',
                position: 'right',
                to: '/versions'
            }, {
                href: `https://github.com/${organizationName}/${projectName}`,
                position: 'right',
                className: 'header-github-link',
                'aria-label': 'GitHub repository',
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
                    href: `https://gitter.im/${organizationName}/${projectName}`,
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
                    label: 'Blog',
                    to: 'blog',
                }, {
                    label: 'GitHub',
                    href: `https://github.com/${organizationName}/${projectName}`,
                }],
            }],
            logo: {
                alt: 'OpenJS Foundation Logo',
                src: '/img/open-jsf-logo.svg',
                href: 'https://openjsf.org/'
            },
            copyright: `Copyright © ${new Date().getFullYear()} OpenJS Foundation`,
        },
    },
    presets: [
        [
            '@docusaurus/preset-classic', {
                docs: {
                    sidebarPath: require.resolve('./sidebars.js'),
                    // Please change this to your repo.
                    editUrl:`https://github.com/${organizationName}/${projectName}/edit/${branch}/website/`,
                    remarkPlugins: [
                        [require('@docusaurus/remark-plugin-npm2yarn'), { sync: true }],
                    ],
                },
                blog: {
                    showReadingTime: true,
                    postsPerPage: 3,
                    // Please change this to your repo.
                    editUrl: `https://github.com/${organizationName}/${projectName}/edit/${branch}/website/blog/`,
                },
                theme: {
                    customCss: require.resolve('./src/css/custom.css'),
                },
                pages: {
                    remarkPlugins: [require('@docusaurus/remark-plugin-npm2yarn')],
                },
            },
        ],
    ],
    plugins: [
        [
            '@docusaurus/plugin-client-redirects',
            {
                fromExtensions: ['html'],
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
        '@docusaurus/plugin-ideal-image'
    ],
    themes: ['@saucelabs/theme-github-codeblock'],
    stylesheets: [
        'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;700&display=swap',
        'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap'
    ],
    scripts: [
        'https://buttons.github.io/buttons.js',
        'https://platform.twitter.com/widgets.js'
    ]
}
