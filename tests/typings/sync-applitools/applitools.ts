const config: WebdriverIO.Config = {
    services: [
        ['applitools', {
            key: '',
            serverUrl: '',
            viewport: {
                width: 1,
                height: 1
            },
            proxy: {
                url: '',
                username: '',
                password: '',
                isHttpOnly: true
            }
        }]
    ]
}

browser.takeSnapshot('title')
browser.takeRegionSnapshot('title', {
    top: 1,
    left: 1,
    width: 1,
    height: 1
})

export default {}
