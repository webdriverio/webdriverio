module.exports = {
    title: 'WebdriverIO',
    tagline: 'Next-gen browser and mobile automation test framework for Node.js',
    url: 'https://webdriver.io',
    baseUrl: '/',
    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',
    favicon: 'img/favicon.png',
    organizationName: 'webdriverio', // Usually your GitHub org/user name.
    projectName: 'webdriver.io', // Usually your repo name.
    themeConfig: {
        colorMode: {
            defaultMode: 'light',
            disableSwitch: false,
            respectPrefersColorScheme: true,
            switchConfig: {
                darkIcon: '🌜',
                lightIcon: '\u2600',
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
              '⭐️  &nbsp; If you like WebdriverIO, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/webdriverio/webdriverio">GitHub</a>! ⭐️',
        },
        navbar: {
            title: 'I/O',
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
                href: 'https://github.com/facebook/docusaurus',
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
                    to: 'docs/',
                }, {
                    label: 'API Reference',
                    to: 'docs/api/',
                // }, {
                //     label: 'Contribute',
                //     to: 'docs/api/',
                // }, {
                //     label: 'Help',
                //     to: 'docs/api/',
                }],
            }, {
                title: 'Community',
                items: [{
                    label: 'Stack Overflow',
                    href: 'https://stackoverflow.com/questions/tagged/webdriver-io',
                }, {
                    label: 'Support Chat',
                    href: 'https://gitter.im/webdriverio/webdriverio',
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
                    href: 'https://github.com/webdriverio/webdriverio',
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
                    editUrl:'https://github.com/webdriverio/webdriverio/edit/master/website/',
                    remarkPlugins: [
                        [require('@docusaurus/remark-plugin-npm2yarn'), { sync: true }],
                    ],
                },
                blog: {
                    showReadingTime: true,
                    postsPerPage: 3,
                    // Please change this to your repo.
                    editUrl: 'https://github.com/webdriverio/webdriverio/edit/master/website/blog/',
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
    plugins: ['@docusaurus/plugin-google-analytics'],
    themes: ['@saucelabs/theme-github-codeblock']
}
