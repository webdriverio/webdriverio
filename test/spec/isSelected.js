describe('isSelected', () => {
    it('should check if a single checkbox element is selected', async function () {
        (await this.client.isSelected('.checkbox_selected')).should.be.true;
        (await this.client.isSelected('.checkbox_notselected')).should.be.false
    })

    it('should check multiple checkbox elements are selected', async function () {
        const isSelected = await this.client.isSelected('[name="checkbox"]')
        isSelected.should.be.an.instanceOf(Array)
        isSelected.should.have.length(2)
        isSelected.should.contain(true)
        isSelected.should.contain(false)
    })

    it('should check if a single radio element is selected', async function () {
        (await this.client.isSelected('.radio_selected')).should.be.true;
        (await this.client.isSelected('.radio_notselected')).should.be.false
    })

    it('should check multiple radio elements are selected', async function () {
        const isSelected = await this.client.isSelected('[name="radio"]')
        isSelected.should.be.an.instanceOf(Array)
        isSelected.should.have.length(2)
        isSelected.should.contain(true)
        isSelected.should.contain(false)
    })
})
