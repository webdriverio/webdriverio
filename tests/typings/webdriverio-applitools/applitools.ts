const config: WebdriverIO.Config = {
    services: [
        ['applitools', {
            key: '',
            serverUrl: '',
            viewport: {
                width: 1,
                height: 1
            }
        }]
    ]
}

async function bar() {
    await browser.takeSnapshot('title')
    await browser.takeRegionSnapshot('title', {
        top: 1,
        left: 1,
        width: 1,
        height: 1
    })
}

export default {}
