const path = require('path')

class WebPage {
    constructor(url, title) {
        this.url = url
        this.title = title
    }
}

let pages = []

pages.push(new WebPage('https://webdriver.io', 'WebdriverIO · Next-gen WebDriver test framework for Node.js'))
pages.push(new WebPage('https://webdriver.io/docs/gettingstarted.html', 'Getting Started · WebdriverIO'))
pages.push(new WebPage('https://webdriver.io/docs/api.html', 'API Docs · WebdriverIO'))

dataProvider(path.resolve(__dirname, 'mochaWithDataProvider.test.js'), pages)
