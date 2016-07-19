describe('drag&drop command test', () => {
    it('should drag and drop an element', async function () {
        /**
         * skip for ie and ff
         * not working anymore
         */
        if (process.env._BROWSER.match(/(internet_explorer|firefox)/)) {
            return
        }

        (await this.client.getValue('.searchinput')).should.be.equal('')
        await this.client.dragAndDrop('.ui-draggable', '.red');
        (await this.client.getValue('.searchinput')).should.be.equal('Dropped!')
    })
})
