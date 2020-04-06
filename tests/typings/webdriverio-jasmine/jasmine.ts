// jasmine-framework
const suite: WebdriverIO.Suite = {
    file: '',
    title: '',
    fullName: ''
}

const config: WebdriverIO.Config = {
    jasmineNodeOpts: {
        oneFailurePerSpec: true,
        specFilter: () => {}
    }
}

export default {}
