/* eslint-disable no-console */

describe('my app', () => {
    before(() => console.log('inner before hook'))

    describe('has feature xyz that', () => {
        it('should to something', () => {
            console.log('inner test block')
        })
    })

    after(() => console.log('inner after hook'))
})
