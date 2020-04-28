// jasmine-framework
const suite: WebdriverIO.Suite = {
    file: '',
    title: '',
    fullName: ''
}

const config: WebdriverIO.Config = {
    jasmineNodeOpts: {
        oneFailurePerSpec: true,
        specFilter: () => {},
        helpers: ['foobar']
    }
}

describe('foo', () => {
    it('bar', () => {
        expect(browser).toHaveTitle('foobar')

        const el = $('selector')
        expect(el).toHaveTextContaining('foobar')
    })
})

export default {}
