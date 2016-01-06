describe('getHTML', () => {

    it('should return html of given selector including the selector element', async function () {
        const html = await this.client.getHTML('.moreNesting section')
        html.should.be.equal('<section><span>bar</span></section>')
    })

    it('should support native selenium selector strategy like partial link', async function () {
        const html = await this.client.getHTML('*=new tab')
        html.should.be.equal('<a id="newWindow" href="./two.html" target="_blank" data-foundby="partial link text">open new tab</a>')
    })

    it('should return html of given selector excluding the selector element', async function () {
        const html = await this.client.getHTML('.moreNesting section', false)
        html.should.be.equal('<span>bar</span>')
    })

    it('should return html of multiple elements', async function () {
        const html = await this.client.getHTML('.box')
        html.should.be.an.instanceOf(Array)
        html.should.have.length(5)
        html.should.contain('<div class="box red ui-droppable" data-foundby="css selector"></div>')
        html.should.contain('<div class="box green"></div>')
        html.should.contain('<div class="box yellow"></div>')
        html.should.contain('<div class="box black"></div>')
        html.should.contain('<div class="box purple" id="purplebox" data-foundby="id"></div>')
    })
})
