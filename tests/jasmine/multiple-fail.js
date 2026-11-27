describe('Jasmine multiple fail()', () => {
    it('reports each fail() call once', () => {
        fail('first failure')
        fail('second failure')
        fail('third failure')
    })
})
