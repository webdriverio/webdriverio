describe('Chaining', () => {
    it('should execute all commands in right order (asynchronous execution test)', function (done) {
        let result = ''
        let client = this.client

        this.client
            .click('.btn1').then(function () {
                result += '1'
            })
            .isVisible('.btn1').then(function () {
                result += '2'
            })
            .call(function () {
                result += '3'

                return client.click('.btn1').then(function () {
                    result += '4'

                    return client.isVisible('.btn1').then(function () {
                        result += '5'
                    }).call(function () {
                        result += '6'

                        return client.call(function () {
                            result += '7'

                            return client.click('.btn1').then(function () {
                                result += '8'

                                return client.call(function () {
                                    result += '9'

                                    return client.isVisible('.btn1').then(function () {
                                        result += '0'

                                        // this can't work
                                        // there's no way the chain
                                        // can now when the setTimeout
                                        // will be finished
                                        // setTimeout(function () {
                                        //     client.call(function () {
                                        //         result += 'a'
                                        //     })
                                        // },1000)
                                    })
                                })
                            }).click('.btn1').then(function () {
                                result += 'b'
                            })
                        })
                    })
                    .click('.btn1').then(function () {
                        result += 'c'
                    })
                    .call(function () {
                        result += 'd'

                        return client.isVisible('.btn1').then(function () {
                            result += 'e'
                        })
                    })
                })
                .click('.btn1').then(function () {
                    result += 'f'
                })
                .call(function () {
                    result.should.be.equal('1234567890bcdef')
                    done()
                })
            })
    })
})
