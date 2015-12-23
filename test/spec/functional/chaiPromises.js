import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

describe('chai-as-promised', () => {
    chai.Should()
    chai.use(chaiAsPromised)

    beforeEach(function () {
        chaiAsPromised.transferPromiseness = this.client.transferPromiseness
    })

    it('should handle a single promise', function () {
        return this.client.getTitle().should.eventually.equal('WebdriverJS Testpage')
    })

    it('should allow chaining of further promises', function () {
        return this.client
            .isVisible('body').should.eventually.be.true
            .getTitle().should.eventually.equal('WebdriverJS Testpage')
    })

    it('should handle failed assertions', function () {
        return this.client
            .isVisible('body').should.eventually.be.true
            .getTitle().should.eventually.equal('some other title')
            .catch((e) => {
                e.should.be.an.instanceof(Error)
            })
    })

    it('should support deep comparisons', function () {
        return this.client.getText('#selectbox option').should.become(['1', '2', '3'])
    })
})
