// mocha-framework
const suite: WebdriverIO.Suite = {
    file: '',
    title: '',
    parent: '',
    fullTitle: '',
    pending: true
}

const config: WebdriverIO.Config = {
    mochaOpts: {
        timeout: 3000,
        allowUncaught: true
    }
}

export default {}
