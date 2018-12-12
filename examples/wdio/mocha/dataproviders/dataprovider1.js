class WebPage {
    constructor(url,title) {
        this.url = url
        this.title = title
    }
}

let pages = []

pages.push(new WebPage('http://realtor.com','Find Real Estate, Homes for Sale, Apartments & Houses for Rent | realtor.com®'))
pages.push(new WebPage('http://webdriver.io','WebdriverIO - WebDriver bindings for Node.js'))


dataProvider("./mocha/mocha.test.js", pages)