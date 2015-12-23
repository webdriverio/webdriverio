describe('getSource', () => {
    it('should return the source code of the whole website', async function () {
        const source = await this.client.getSource()
        source.indexOf('Test CSS Attributes').should.be.greaterThan(0)
        source.indexOf('open new tab').should.be.greaterThan(0)
        source.indexOf('$(\'.btn3_clicked\').css(\'display\',\'block\')').should.be.greaterThan(0)
        source.indexOf('</html>').should.be.greaterThan(0)
    })
})
