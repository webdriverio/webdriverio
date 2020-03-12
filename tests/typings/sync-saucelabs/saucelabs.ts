const config: WebdriverIO.Config = {
    services: [
        ['sauce', {
            sauceConnect: true,
            sauceConnectOpts: {}
        }]
    ]
}

export default { config }
