describe('hasFocus', () => {
    it('should return true when one of the element type is active.', async function () {
        (await this.client.hasFocus('input')).should.be.true
    })

    it('should return true if element is active', async function () {
        (await this.client.hasFocus('[name="login"]')).should.be.true
    })

    it('should return false on inactive elements', async function () {
        (await this.client.hasFocus('body')).should.be.false
    })

    it('should return true when selector is used as context and has focus', async function () {
        (await this.client.element('[name="login"]').hasFocus()).should.be.true
    })

    it('should return false when selector is used as context and does not have focus', async function () {
        (await this.client.element('body').hasFocus()).should.be.false
    })

    it('should return true when one of the elements collection is active and is using `elements()`', async function () {
        (await this.client.elements('input').hasFocus()).should.be.true
    })

    it('should return false when using `element()` with non-matching result', async function () {
        (await this.client.element('input').hasFocus()).should.be.false
    })

    it('should return true when body has focus', async function () {
        await this.client.execute(() => { $('[name=login]').blur() });
        (await this.client.hasFocus('body')).should.be.true
    })
})
