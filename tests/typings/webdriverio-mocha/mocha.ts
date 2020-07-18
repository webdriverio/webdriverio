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
        allowUncaught: true,
        require: ['@babel/register', './test/helpers/common.js'],
        compilers: ['coffee:coffee-script/register'],
        ui: 'tdd'
    }
}

export default {}
