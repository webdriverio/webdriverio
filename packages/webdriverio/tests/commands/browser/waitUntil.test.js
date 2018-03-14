import request from 'request'
import { remote } from '../../../src'

describe('waitUntil', () => {
    let browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('Should throw an error if an invalid condition is used', async () => {  
        let error
        expect.assertions(1)  
        try {
            await browser.waitUntil('foo',500,'Timed Out',200)
        } catch(e) {
            error = e
        } finally{
            expect(error.message).toContain('Condition is not a function')
        }
    })

    it('Should throw an error when the waitUntil times out', async () => {
        let error
        expect.assertions(1)
        try {
            await browser.waitUntil(() => 
                new Promise((resolve) => 
                    setTimeout(
                        () => resolve(false), 
                        200)),
            500,'Timed Out',200)
        } catch(e) {
            error = e
        } finally{
            expect(error.message).toContain('Timed Out')
        }
    })

    it('Should throw an error when the promise is rejected', async () => {
        let error
        expect.assertions(1)
        try {
            await browser.waitUntil(() => 
                new Promise((resolve,reject) => 
                    setTimeout(
                        () => reject(new Error('foobar')), 
                        200,400)),
            500,'Timed Out',200)
        } catch(e) {
            error = e
        } finally{
            expect(error.message).toContain('Promise was rejected with the following reason: Error: foobar')
        }
    })

    it('Should use default timeout setting from config if passed in value is not a number', async () => {
        let error
        expect.assertions(1)
        try {
            await browser.waitUntil(() => 
                new Promise((resolve) => 
                    setTimeout(
                        () => resolve(false), 
                        500)),
            'blah','Timed Out',200)
        } catch(e) {
            error = e
        } finally{
            expect(error.message).toContain('Timed Out')
        }
    })

    it('Should use default interval setting from config if passed in value is not a number', async () => {
        let error
        expect.assertions(1)
        try {
            await browser.waitUntil(() => 
                new Promise((resolve) => 
                    setTimeout(
                        () => resolve(false), 
                        500)),
            1000,'Timed Out','blah')
        } catch(e) {
            error = e
        } finally{
            expect(error.message).toContain('Timed Out')
        }
    })
    
    it('Should pass', async() => {
        let error
        expect.assertions(1)
        try {
            await browser.waitUntil(() => 
                new Promise((resolve) => 
                    setTimeout(
                        () => resolve(true), 
                        200)),
            500,'Timed Out',200)
        } catch(e) {
            error = e
        } finally{
            expect(error).toBeUndefined()
        }
    })   

    afterEach(() => {
        request.mockClear()
    })
})
