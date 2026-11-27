describe('Jasmine fail() calls', () => {
    it('records three fail() calls without duplicating the first', () => {
        fail('first')
        fail('second')
        fail('third')
    })

    it('records a single fail(Error) once', () => {
        fail(new Error('explicit error'))
    })

    it('keeps both fail() and a subsequent thrown error', () => {
        fail('before throw')
        throw new Error('uncaught boom')
    })
})
