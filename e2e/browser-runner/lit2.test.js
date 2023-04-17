before(() => {
    console.log('ROOT before')
})

describe('root suite', () => {
    it('root test', () => {
        console.log('root test')
    })

    describe('nested suite', () => {
        it('nested test', () => {
            console.log('nested test')
        })
    })
})
