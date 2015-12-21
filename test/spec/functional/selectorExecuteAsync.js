describe('selectorExecuteAsync', () => {
    it('should be able to resolve a css selector', async function () {
        (await this.client.selectorExecuteAsync(
            '[class="sometext"]',
            (arr, cb) => setTimeout(() => cb(arr[0].innerHTML), 100)
        )).should.be.equal('some text')
    })

    it('should be able to resolve an xpath selector', async function () {
        (await this.client.selectorExecuteAsync(
            '//*[@class="sometext"]',
            (arr, cb) => setTimeout(() => cb(arr[0].innerHTML), 100)
        )).should.be.equal('some text')
    })

    it('should be able to resolve a name selector', async function () {
        (await this.client.selectorExecuteAsync(
            '[name="searchinput"]',
            (arr, cb) => setTimeout(() => cb(arr[0].getAttribute('name')), 100)
        )).should.be.equal('searchinput')
    })

    it('should be able to resolve an id selector', async function () {
        (await this.client.selectorExecuteAsync(
            '#selectbox',
            (arr, cb) => setTimeout(() => cb(arr[0].getAttribute('id')), 100)
        )).should.be.equal('selectbox')
    })

    it('should be able to resolve a tag name selector', async function () {
        (await this.client.selectorExecuteAsync(
            '<select />',
            (arr, cb) => setTimeout(() => {
                var found = 'nothing found'
                arr.forEach((el) => {
                    if (el.getAttribute('id') === 'selectbox') {
                        found = 'selectbox found'
                    }
                })
                cb(found)
            }, 100)
        )).should.be.equal('selectbox found')
    })

    it('should be able to resolve a link text selector', async function () {
        (await this.client.selectorExecuteAsync(
            '=GitHub Repo',
            (arr, cb) => setTimeout(() => cb(arr.length > 0 && arr[0].getAttribute('id')), 100)
        )).should.be.equal('githubRepo')
    })

    it('should be able to resolve a partial link text selector', async function () {
        (await this.client.selectorExecuteAsync(
            '*=GitHub ',
            (arr, cb) => setTimeout(() => cb(arr.length > 0 && arr[0].getAttribute('id')), 100)
        )).should.be.equal('githubRepo')
    })

    it('should be able to accept args', async function () {
        (await this.client.selectorExecuteAsync(
            '*=GitHub ',
            (arr, arg, cb) => setTimeout(() => cb(arr.length > 0 && arr[0].getAttribute('id') + arg), 100),
            ' with an argument'
        )).should.be.equal('githubRepo with an argument')
    })

    it('should be able to pass functions as args', async function () {
        (await this.client.selectorExecuteAsync(
            '*=GitHub ',
            (arr, arg, cb) => setTimeout(() => cb(arg(arr.length > 0 && arr[0].getAttribute('id'))), 100),
            (str) => str + ' with an argument'
        )).should.be.equal('githubRepo with an argument')
    })

    it('should be able to accept multiple selectors', async function () {
        (await this.client.selectorExecuteAsync(
            ['*=GitHub ', '//html/body/section/h1'],
            (links, divs, arg, cb) => setTimeout(() => {
                var returnStr = 'Returning '
                links.length > 0 && (returnStr += links[0].getAttribute('id'))
                returnStr += ' and '
                divs.length > 0 && (returnStr += divs[0].innerHTML)
                cb(arg(returnStr))
            }, 100),
            (str) => str + ' with an argument'
        )).should.be.equal('Returning githubRepo and Test CSS Attributes with an argument')
    })
})
