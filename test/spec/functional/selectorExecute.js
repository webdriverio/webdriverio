describe('selectorExecute', () => {
    it('should be able to resolve a css selector', async function () {
        (await this.client.selectorExecute('[class="sometext"]', (arr) => arr[0].innerHTML))
            .should.be.equal('some text')
    })

    it('should be able to resolve an xpath selector', async function () {
        (await this.client.selectorExecute('//*[@class="sometext"]', (arr) => arr[0].innerHTML))
            .should.be.equal('some text')
    })

    it('should be able to resolve a name selector', async function () {
        (await this.client.selectorExecute('[name="searchinput"]', (arr) => arr[0].getAttribute('name')))
            .should.be.equal('searchinput')
    })

    it('should be able to resolve an id selector', async function () {
        (await this.client.selectorExecute('#selectbox', (arr) => arr[0].getAttribute('id')))
            .should.be.equal('selectbox')
    })

    it('should be able to resolve a tag name selector', async function () {
        (await this.client.selectorExecute('<select />', (arr) => {
            var found = 'nothing found'
            arr.forEach((el) => {
                if (el.getAttribute('id') === 'selectbox') {
                    found = 'selectbox found'
                }
            })
            return found
        })).should.be.equal('selectbox found')
    })

    it('should be able to resolve a link text selector', async function () {
        (await this.client.selectorExecute('=GitHub Repo', (arr) => arr.length > 0 && arr[0].getAttribute('id')))
            .should.be.equal('githubRepo')
    })

    it('should be able to resolve a partial link text selector', async function () {
        (await this.client.selectorExecute('*=GitHub ', (arr) => arr.length > 0 && arr[0].getAttribute('id')))
            .should.be.equal('githubRepo')
    })

    it('should be able to accept args', async function () {
        (await this.client.selectorExecute(
            '*=GitHub ',
            (arr, arg) => arr.length > 0 && arr[0].getAttribute('id') + arg,
            ' with an argument'
        )).should.be.equal('githubRepo with an argument')
    })

    it('should be able to pass functions as args', async function () {
        (await this.client.selectorExecute(
            '*=GitHub ',
            (arr, arg) => arg(arr.length > 0 && arr[0].getAttribute('id')),
            (str) => str + ' with an argument'
        )).should.be.equal('githubRepo with an argument')
    })

    it('should be able to accept multiple selectors', async function () {
        (await this.client.selectorExecute(['*=GitHub ', '//*[@class="sometext"]'], (links, divs, arg) => {
            var returnStr = 'Returning '
            links.length > 0 && (returnStr += links[0].getAttribute('id'))
            returnStr += ' and '
            divs.length > 0 && (returnStr += divs[0].innerHTML)
            return arg(returnStr)
        }, (str) => str + ' with an argument')).should.be.equal('Returning githubRepo and some text with an argument')
    })
})
