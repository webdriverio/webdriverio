const repoUrl = 'https://github.com/webdriverio/webdriverio'

module.exports = {
    title: 'WebdriverIO',
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
    editUrl: repoUrl + '/edit/master/docs/',
    headerIcon: 'img/docusaurus.svg',
    footerIcon: 'img/docusaurus.svg',
    favicon: 'img/favicon.png',

    colors: {
        primaryColor: '#ea5906',
        secondaryColor: '#111111'
    },

    // This copyright info is used in /core/Footer.js and blog rss/atom feeds.
    copyright: 'Copyright © ' + new Date().getFullYear() + ' JS.Foundation',

    highlight: {
        // Highlight.js theme to use for syntax highlighting in code blocks
        theme: 'default'
    },

    // Add custom scripts here that would be placed in <script> tags
    scripts: ['https://buttons.github.io/buttons.js'],

    /* On page navigation for the current documentation page */
    onPageNav: 'separate',

    /* Open Graph and Twitter card images */
    ogImage: 'img/docusaurus.png',
    twitterImage: 'img/docusaurus.png'

    // You may provide arbitrary config keys to be used as needed by your
    // template. For example, if you need your repo's URL...
    //   repoUrl: 'https://github.com/facebook/test-site',
}
