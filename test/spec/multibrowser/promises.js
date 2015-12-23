import conf from '../../conf/index'

describe('promise support', () => {
    it('should sync promises with call', function () {
        let result = ''
        return this.client.then(() => {
            result += '1'
        }).then(() => {
            result += '2'
        }).then(() => {
            result += '3'
        }).then(() => {
            result += '4'
        }).call(() => {
            result.should.be.equal('1234')
        })
    })

    it('should propagate results to then', function () {
        return this.client.getTitle().then(function (title) {
            title.browserA.should.be.equal('WebdriverJS Testpage')
            title.browserB.should.be.equal('WebdriverJS Testpage')
            return this.url()
        }).then((url) => {
            url.browserA.value.should.be.equal(conf.testPage.start)
            url.browserB.value.should.be.equal(conf.testPage.start)
        }).then((result) => {
            /**
             * undefined because last then doesn't return a promise
             */
            expect(result).to.be.undefined
        })
    })

    it('should be working on custom commands', function () {
        this.client.addCommand('fakeCommand', (param) => param)
        let result = ''

        return this.client.fakeCommand(0).then(function () {
            return this.fakeCommand(1)
        }).then(function (res) {
            result += res.browserA.toString()
            return this.fakeCommand(2)
        }).then(function (res) {
            result += res.browserA.toString()
            return this.fakeCommand(3)
        }).then(function (res) {
            result += res.browserA.toString()
            return this.fakeCommand(4)
        }).then(function (res) {
            result += res.browserA.toString()
        }).call(() => result.should.be.equal('1234'))
    })

    it('should reject promise if command throws an error', function () {
        let result = null
        return this.client.click('#notExisting').then(() => {
            result = false
        }, () => {
            result = true
        }).call(() => result.should.be.equal(true))
    })

    it('should handle waitfor commands within then callbacks', function () {
        return this.client.getTitle().then(function () {
            return this.pause(1000).isVisible('body')
        }).then((result) => {
            result.browserA.should.be.true
            result.browserB.should.be.true
        })
    })

    it('should provide a catch and fail method that executes if the command throws an error', function () {
        let gotExecutedCatch = false
        return this.client.click('#notExisting').catch(() => {
            gotExecutedCatch = true
        }).call(() => gotExecutedCatch.should.be.true)
    })

    it('should provide a catch and fail method that doesn\'t execute if the command passes', function () {
        let gotExecutedCatch = false
        return this.client.click('body').catch(() => {
            gotExecutedCatch = true
        }).call(() => gotExecutedCatch.should.be.false)
    })

    it('should propagate not only promises but also objects or strings', function () {
        let hasBeenExecuted = 0
        return this.client.isVisible('body').then((result) => {
            hasBeenExecuted++
            return result
        }).then((isVisible) => {
            hasBeenExecuted++
            isVisible.browserA.should.be.true
            isVisible.browserB.should.be.true
            return 'a string'
        }).then((aString) => {
            hasBeenExecuted++
            aString.should.be.equal('a string')
            return { myElem: 42 }
        }).then((res) => {
            hasBeenExecuted++
            res.should.have.property('myElem')
            res.myElem.should.be.equal(42)
        }).call(() => hasBeenExecuted.should.be.equal(4))
    })
})
