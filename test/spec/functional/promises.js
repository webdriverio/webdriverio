import Q from 'q'
import conf from '../../conf/index.js'

describe('PromiseHandler', () => {
    it('should sync promises with call', function () {
        let result = ''
        return this.client.then(function () {
            result += '1'
        }).then(function () {
            result += '2'
        }).then(function () {
            result += '3'
        }).then(function () {
            result += '4'
        }).call(() => result.should.be.equal('1234'))
    })

    it('should add returning numbers', function () {
        let result = 0
        return this.client.then(function () {
            return 1
        }).then(function (res) {
            result += res
            return 2
        }).then(function (res) {
            result += res
            return 3
        }).then(function (res) {
            result += res
            return 4
        }).then(function (res) {
            result += res
        }).call(() => result.should.be.equal(10))
    })

    it('should propagate results to then', function () {
        return this.client.getTitle().then(function (title) {
            title.should.be.equal('WebdriverJS Testpage')
            return this.url()
        }).then((url) => {
            url.value.should.be.equal(conf.testPage.start)
        }).then((result) => {
            /**
             * undefined because last then doesn't return a promise
             */
            (result === undefined).should.be.true
        })
    })

    it('should be working on custom commands', function () {
        let result = ''

        this.client.addCommand('fakeCommand', function (param) {
            return param
        })

        return this.client.fakeCommand(0).then(function () {
            return this.fakeCommand(1)
        }).then(function (res) {
            result += res.toString()
            return this.fakeCommand(2)
        }).then(function (res) {
            result += res.toString()
            return this.fakeCommand(3)
        }).then(function (res) {
            result += res.toString()
            return this.fakeCommand(4)
        }).then(function (res) {
            result += res.toString()
        }).call(() => result.should.be.equal('1234'))
    })

    it('should reject promise if command throws an error', function () {
        let result = null
        return this.client.click('#notExisting').then(() => {
            result = false
        }, () => {
            result = true
        })
        .call(() => {
            result.should.be.equal(true)
        })
    })

    it('should handle waitfor commands within then callbacks', function () {
        return this.client.getTitle().then(function () {
            return this.pause(1000).pause(100).isVisible('body')
        }).then((result) => result.should.be.true)
    })

    it('should provide a catch method that executes if the command throws an error', function () {
        let gotExecutedCatch = false

        return this.client.click('#notExisting').catch(function () {
            gotExecutedCatch = true
        }).call(() => gotExecutedCatch.should.be.true)
    })

    it('should provide a catch and fail method that doesn\'t execute if the command passes', function () {
        let gotExecutedCatch = false

        return this.client.click('body').catch(function () {
            gotExecutedCatch = true
        }).call(() => gotExecutedCatch.should.be.false)
    })

    it('should propagate not only promises but also objects or strings', function () {
        var hasBeenExecuted = 0
        return this.client.isVisible('body').then(function (isVisible) {
            hasBeenExecuted++
            return isVisible
        }).then(function (isVisible) {
            hasBeenExecuted++
            isVisible.should.be.true
            return 'a string'
        }).then(function (aString) {
            hasBeenExecuted++
            aString.should.be.equal('a string')
            return { myElem: 42 }
        }).then(function (res) {
            hasBeenExecuted++
            res.should.have.property('myElem')
            res.myElem.should.be.equal(42)
        }).call(() => hasBeenExecuted.should.be.equal(4))
    })

    it('should execute promise in a right order', function () {
        let result = ''

        return this.client.title().then(function () {
            result += '1'
            return this.call(function () {}).then(function () {
                result += '2'
                return this.then(function () {
                    result += '3'
                })
            })
        }).then(() => {
            result += '4'
        }).call(() => result.should.be.equal('1234'))
    })

    it('should resolve array values', function () {
        return this.client.title().then(() => [1, 2]).then((value) => {
            expect(value).to.be.instanceof(Array)
            value.should.have.length(2)
        })
    })

    describe('should be able to handle 3rd party promises', function () {
        it('should handle Q\'s deferred.promise', function () {
            const deferred = Q.defer()
            deferred.resolve('success')

            return this.client.status().then(() => deferred.promise).then(
                (result) => result.should.be.equal('success'))
        })

        it('should work with ES6 promises', function () {
            return this.client.status().then(
                () => new Promise((resolve) => resolve('success'))
            ).then((result) => result.should.be.equal('success'))
        })
    })

    it('should be able to pass a command execution as parameter', function () {
        return this.client.then(this.client.getTitle).then(
            (title) => title.should.be.equal(conf.testPage.title))
    })

    it('should be able to deal with string errors', function () {
        return this.client.url().then(() => {
            throw 'stringerror' // eslint-disable-line no-throw-literal
        }).then(() => {
            throw new Error('string error wasn\'t translated to a real error')
        }, (e) => {
            expect(e).to.be.instanceof(Error)
        })
    })
})
