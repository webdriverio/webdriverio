describe('chaining', () => {
    it('should execute all commands in right order (asynchronous execution test)', function (done) {
        let result = ''

        this.client
            .click('.btn1').then(() => {
                result += '1'
            })
            .isVisible('.btn1').then(() => {
                result += '2'
            })
            .call(() => {
                result += '3'

                return this.browserA.click('.btn1').then(() => {
                    result += '4'

                    return this.browserB.isVisible('.btn1').then(() => {
                        result += '5'
                    }).call(() => {
                        result += '6'

                        return this.browserA.call(() => {
                            result += '7'

                            return this.browserB.click('.btn1').then(() => {
                                result += '8'

                                return this.browserA.call(() => {
                                    result += '9'

                                    return this.browserB.isVisible('.btn1').then(() => {
                                        result += '0'

                                        // this can't work
                                        // there's no way the chain
                                        // can now when the setTimeout
                                        // will be finished
                                        // setTimeout(() => {
                                        //     client.call(() => {
                                        //         result += 'a'
                                        //     })
                                        // },1000)
                                    })
                                })
                            }).click('.btn1').then(() => {
                                result += 'b'
                            })
                        })
                    })
                    .click('.btn1').then(() => {
                        result += 'c'
                    })
                    .call(() => {
                        result += 'd'

                        return this.browserA.isVisible('.btn1').then(() => {
                            result += 'e'
                        })
                    })
                })
                .click('.btn1').then(() => {
                    result += 'f'
                })
                .call(() => {
                    result.should.be.equal('1234567890bcdef')
                    done()
                })
            })
    })

    it('should be able to sync browser chained commands', function () {
        let result = ''

        this.browserA.isVisible('.btn1').then(() => {
            result += '0' // use same value as we don't know what command is faster
        })

        this.browserB.click('.btn1').then(() => {
            result += '0' // use same value as we don't know what command is faster
        })

        return this.client.sync().click('.btn1').then(() => {
            result += '7'
        }).call(() => result.should.be.equal('007'))
    })
})
