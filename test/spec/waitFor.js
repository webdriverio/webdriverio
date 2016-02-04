describe('waitFor', () => {
    const duration = 10000

    describe('Enabled', () => {
        it('should return w/o err after element was enabled', async function () {
            (await this.client.waitForEnabled('//html/body/section/input[8]', duration))
                .should.be.equal(true)
        })

        it('(reverse) should return w/o err after element was disabled', async function () {
            (await this.client.waitForEnabled('.waitForValueEnabledReverse', duration, true))
                .should.be.equal(true)
        })

        it('should return with an error if the element never becomes enabled', function () {
            return expect(this.client.waitForEnabled('.waitForValueEnabledReverse', 10))
                .to.be.rejectedWith('element (.waitForValueEnabledReverse) still not enabled after 10ms')
        })

        it('should pass through an error from isEnabled()', function () {
            return expect(this.client.waitForEnabled('#notExisting', duration, true))
                .to.be.rejectedWith('An element could not be located on the page using the given search parameters')
        })
    })

    describe('Exist', () => {
        it('should return w/o err after element was appended to the DOM', async function () {
            (await this.client.waitForExist('//div[text()="Sorry, I\'m late!"]', duration))
                .should.be.equal(true)
        })

        it('(reverse) should return w/o err after element was removed from the DOM', async function () {
            (await this.client.waitForExist('.goAway', duration, true))
                .should.be.equal(true)
        })

        it('should return with an error if the element never exists', function () {
            return expect(this.client.waitForExist('#notExisting', 10))
                .to.be.rejectedWith('element (#notExisting) still not existing after 10ms')
        })

        it('should pass through an error from isExisting()', function () {
            var restore = () => this.client.addCommand('isExisting', require('../../lib/commands/isExisting'), true)
            this.client.addCommand('isExisting', () => {
                throw new Error('My error')
            }, true)

            return expect(this.client.waitForExist('#notExisting', duration))
                .to.be.rejectedWith('My error')
                .then(restore, (err) => {
                    restore()
                    throw err
                })
        })
    })

    describe('Selected', () => {
        it('should return w/o err after element was selected', async function () {
            (await this.client.waitForSelected('//*[@id="selectbox"]/option[3]', duration))
                .should.be.equal(true)
        })

        it('(reverse) should return w/o err after element was unselected', async function () {
            (await this.client.waitForSelected('.option2', duration, true))
                .should.be.equal(true)
        })

        it('should return with an error if the element never becomes visible', async function () {
            return expect(this.client.waitForSelected('.option2', 10))
                .to.be.rejectedWith('element (.option2) still not selected after 10ms')
        })

        it('should pass through an error from isSelected()', async function () {
            return expect(this.client.waitForSelected('#notExisting', duration, true))
                .to.be.rejectedWith('An element could not be located on the page using the given search parameters')
        })
    })

    describe('Text', () => {
        it('should return w/o err after element got a text/content', async function () {
            (await this.client.waitForText('//*[contains(@class, "sometextlater")]', duration))
                .should.be.equal(true)
        })

        it('(reverse) should return w/o err after text/content element was removed', async function () {
            (await this.client.waitForText('.sometext', duration, true))
                .should.be.equal(true)
        })

        it('should return with an error if the text never appears', function () {
            return expect(this.client.waitForText('.sometext', 10))
                .to.be.rejectedWith('element (.sometext) still without text after 10ms')
        })

        it('should pass through an error from getText()', function () {
            return expect(this.client.waitForText('#notExisting', duration, true))
                .to.be.rejectedWith('An element could not be located on the page using the given search parameters')
        })
    })

    describe('Value', () => {
        it('should return w/o err after element got a value', async function () {
            (await this.client.waitForValue('//*[contains(@class, "waitForValueEnabledReverse")]', duration))
                .should.be.equal(true)
        })

        it('(reverse) should return w/o err after element lost its value', async function () {
            (await this.client.waitForValue('.waitForValueEnabled', duration, true))
                .should.be.equal(true)
        })

        it('should return with an error if the text never appears', function () {
            return expect(this.client.waitForValue('.sometext', 10))
                .to.be.rejectedWith('element (.sometext) still without a value after 10ms')
        })

        it('should pass through an error from getValue()', function () {
            return expect(this.client.waitForValue('#notExisting', duration, true))
                .to.be.rejectedWith('An element could not be located on the page using the given search parameters')
        })
    })

    describe('Visible', () => {
        it('should return w/o err after element moved into document bounderies', async function () {
            (await this.client.waitForVisible('//*[contains(@class, "notVisible")]', duration))
                .should.be.equal(true)
        })

        it('(reverse) should return w/o err after element left document bounderies', async function () {
            (await this.client.waitForVisible('.onMyWay', duration, true))
                .should.be.equal(true)
        })

        it('should return with an error if the element never becomes visible', function () {
            return expect(this.client.waitForVisible('#notExisting', 10))
                .to.be.rejectedWith('element (#notExisting) still not visible after 10ms')
        })

        it('should pass through an error from isVisible()', function () {
            const restore = () => this.client.addCommand('isVisible', require('../../lib/commands/isVisible'), true)
            this.client.addCommand('isVisible', () => {
                throw new Error('My error')
            }, true)

            return expect(this.client.waitForVisible('#notExisting', duration))
                .to.be.rejectedWith('My error')
                .then(restore, (err) => {
                    restore()
                    throw err
                })
        })
    })

    describe('timeout', () => {
        it('should use specified timeout', function (done) {
            var startTime = Date.now()
            return this.client.waitForExist('#notExisting').then(() => {
                done(new Error('waitForExist promise should be rejected'))
            }, () => {
                const delta = Date.now() - startTime
                delta.should.be.above(1000)
                done()
            })
        })

        it('should use parameter timeout and should overwrite default value', function (done) {
            var startTime = Date.now()
            this.client.waitForExist('#notExisting', 2000).then(() => {
                done(new Error('waitForExist promise should be rejected'))
            }, () => {
                var delta = Date.now() - startTime
                delta.should.be.above(2000)
                done()
            })
        })
    })
})
