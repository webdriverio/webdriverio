const repoUrl = 'https://github.com/webdriverio/webdriverio'

module.exports = {
    title: 'WebdriverIO',
    projectName: 'webdriver.io',
    tagline: 'Next-gen WebDriver test framework for Node.js',
    url: 'https://webdriver.io',
    baseUrl: '/',
    headerLinks: [
        { doc: 'gettingstarted', label: 'Guide' },
        { doc: 'api', label: 'API' },
        { page: 'help', label: 'Help' },
        { blog: true, label: 'Blog' },
        { languages: true },
        { search: true },
        { href: repoUrl, label: 'GitHub' }
    ],
    repoUrl: repoUrl,
    editUrl: repoUrl + '/edit/master/docs/',
    footerIcon: 'img/twitter-profile.png',
    favicon: 'img/favicon.png',

    colors: {
        primaryColor: '#ea5906',
        secondaryColor: '#111111'
    },

    // This copyright info is used in /core/Footer.js and blog rss/atom feeds.
    copyright: 'Copyright © ' + new Date().getFullYear() + ' OpenJS Foundation',

    highlight: {
        // Highlight.js theme to use for syntax highlighting in code blocks
        theme: 'github'
    },

    algolia: {
        apiKey: '1b22fa823f22b7916528edc0e36d9d4a',
        indexName: 'webdriver',
        appId: 'BH4D9OD16A'
    },

    gaTrackingId: 'UA-47063382-1',

    // Add custom scripts here that would be placed in <script> tags
    scripts: [
        'https://buttons.github.io/buttons.js',
        'https://platform.twitter.com/widgets.js',
        'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js'
    ],

    /* On page navigation for the current documentation page */
    onPageNav: 'separate',

    /* Open Graph and Twitter card images */
    ogImage: 'img/webdriverio.png',
    twitter: true,
    twitterImage: 'img/webdriverio.png',
    twitterUsername: 'webdriverio',
    scrollToTop: true,

    /* Show last update time */
    enableUpdateTime: true,

    blogSidebarCount: 25

    // You may provide arbitrary config keys to be used as needed by your
    // template. For example, if you need your repo's URL...
    //   repoUrl: 'https://github.com/facebook/test-site',
}
