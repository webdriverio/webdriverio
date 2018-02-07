import { is$$ } from '../src'

describe('results', () => {
    describe('.is$$', () => {
        it('returns false if given a non-array', () => {
            is$$('something').should.be.false()
        })

        it('returns false when given an empty array', () => {
            is$$([]).should.be.false()
        })

        it('returns false when the elements in the array have no ELEMENTs', () => {
            is$$([{}]).should.be.false()
        })

        it('returns false given an array of undefined', () => {
            is$$([undefined]).should.be.false()
        })

        it('returns true given an array that has a truthy ELEMENT in the first position', () => {
            is$$([{ ELEMENT: {} }]).should.be.true()
        })
    })
})
