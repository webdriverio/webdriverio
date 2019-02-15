import ShadowDomService from '../src'

describe('ShadowDomService', () => {

    let service
    beforeAll(() => {
        service = new ShadowDomService()
        global.browser = {addCommand: jest.fn()}
    })
    describe('before', () => {
        it('should add the commands', () => {
            service.before()
            expect(global.browser.addCommand.mock.calls).toHaveLength(2)
            expect(global.browser.addCommand.mock.calls[0][0]).toBe('shadow$')
            expect(global.browser.addCommand.mock.calls[0][1]).toEqual(expect.any(Function))
            expect(global.browser.addCommand.mock.calls[0][2]).toBe(true)
            expect(global.browser.addCommand.mock.calls[1][0]).toBe('shadow$$')
            expect(global.browser.addCommand.mock.calls[1][1]).toEqual(expect.any(Function))
            expect(global.browser.addCommand.mock.calls[1][2]).toBe(true)
        })
    })

    describe('shadow$', () => {
        let client
        beforeAll(() => {
            client = {$: jest.fn()}
        })
        it('should call client.$ with a function', () => {
            ShadowDomService.shadow$.call(client, '#foo')
            expect(client.$.mock.calls).toHaveLength(1)
            expect(client.$.mock.calls[0]).toEqual([expect.any(Function)])
        })
    })

    describe('shadow$$', () => {
        let client
        beforeAll(() => {
            client = {$$: jest.fn()}
        })
        it('should call client.$$ with a function', () => {
            ShadowDomService.shadow$$.call(client, '#foo')
            expect(client.$$.mock.calls).toHaveLength(1)
            expect(client.$$.mock.calls[0]).toEqual([expect.any(Function)])
        })
    })

    describe('fnFactory', () => {
        it('should return a function', () => {
            expect(ShadowDomService.fnFactory('#foo')).toEqual(expect.any(Function))
            expect(ShadowDomService.fnFactory('#foo', true)).toEqual(expect.any(Function))
        })
        describe('returned function', () => {
            let element
            let shadowElement
            beforeAll(() => {
                element = {
                    querySelector: jest.fn(),
                    querySelectorAll: jest.fn(),
                }
                shadowElement = {
                    shadowRoot: {
                        querySelector: jest.fn(),
                        querySelectorAll: jest.fn(),
                    }
                }
            })
            it('should call querySelector if client does not have a shadowRoot', () => {
                ShadowDomService.fnFactory('#foo').call(element)
                expect(element.querySelector.mock.calls).toHaveLength(1)
                expect(element.querySelector.mock.calls[0]).toEqual(['#foo'])
            })
            it('should call querySelectorAll if client does not have a shadowRoot', () => {
                ShadowDomService.fnFactory('#foo', true).call(element)
                expect(element.querySelectorAll.mock.calls).toHaveLength(1)
                expect(element.querySelectorAll.mock.calls[0]).toEqual(['#foo'])
            })
            it('should call shadowRoot.querySelector if client does have a shadowRoot', () => {
                ShadowDomService.fnFactory('#foo').call(shadowElement)
                expect(shadowElement.shadowRoot.querySelector.mock.calls).toHaveLength(1)
                expect(shadowElement.shadowRoot.querySelector.mock.calls[0]).toEqual(['#foo'])
            })
            it('should call shadowRoot.querySelectorAll if client does have a shadowRoot', () => {
                ShadowDomService.fnFactory('#foo', true).call(shadowElement)
                expect(shadowElement.shadowRoot.querySelectorAll.mock.calls).toHaveLength(1)
                expect(shadowElement.shadowRoot.querySelectorAll.mock.calls[0]).toEqual(['#foo'])
            })
        })
    })
})
