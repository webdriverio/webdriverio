describe('drag&drop command test', () => {
    it('should drag and drop an element', async function () {
        /**
         * skip for ie
         * not working anymore
         */
        if (process.env._BROWSER === 'internet_explorer') {
            return
        }

        (await this.client.getValue('.searchinput')).should.be.equal('')
        await this.client.dragAndDrop('.ui-draggable', '.red');
        (await this.client.getValue('.searchinput')).should.be.equal('Dropped!')
    })
})
