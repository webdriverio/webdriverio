console.log('Retry file loaded.')

describe('retry', function () {
    this.retries(2)

    console.log('Retry suite loaded.')

    it('should execute once due to zero retries', function () {
        this.retries(0)

        console.log('Test for zero retries loaded.')

        throw Error('Deliberate error.')
    })

    it('should execute twice due to one test-level retry', function () {
        this.retries(1)

        console.log('Test for one retry loaded.')

        throw Error('Deliberate error.')
    })

    it('should execute three times due to two suite-level retries', function () {
        console.log('Test for two retries loaded.')

        throw Error('Deliberate error.')
    })
})
