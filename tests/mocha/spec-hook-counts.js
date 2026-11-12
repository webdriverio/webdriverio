describe('Hook failure counts', () => {
    describe('passing test with failing teardown', () => {
        it('passes', () => {})
        after(() => {
            throw new Error('teardown failed')
        })
    })

    describe('failing test with failing teardown', () => {
        it('fails', () => {
            throw new Error('test failed')
        })
        after(() => {
            throw new Error('second teardown failed')
        })
    })

    describe('failing setup', () => {
        before(() => {
            throw new Error('setup failed')
        })
        it('does not run', () => {
            throw new Error('test must not run')
        })
    })
})

after(() => {
    throw new Error('root teardown failed')
})
