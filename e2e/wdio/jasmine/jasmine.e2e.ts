/**
 * The global `expect` keeps Jasmine sync matchers sync, and sends WebdriverIO
 * matchers and Jasmine async matchers to `expectAsync`.
 */
const page = 'data:text/html,' + encodeURIComponent(`
    <title>Jasmine Page</title>
    <h1 id="heading">Hello Jasmine</h1>
    <div id="box" style="display: block; width: 120px; height: 40px"></div>
    <ul><li class="item">a</li><li class="item">b</li></ul>
`)

describe('Jasmine expect', () => {
    beforeAll(async () => {
        await browser.url(page)
    })

    it('keeps Jasmine sync matchers synchronous', () => {
        expect(expect(1).toBe(1)).toBeUndefined()
        expect(expect(1).not.toBe(2)).toBeUndefined()
        expect(expect(1).withContext('context').toBe(1)).toBeUndefined()
        expect(expect([1, 2]).toHaveSize(2)).toBeUndefined()
        expect(expect({ a: 'x' }).toEqual(expect.objectContaining({ a: 'x' }))).toBeUndefined()
    })

    it('runs Jasmine spy matchers', () => {
        const spy = jasmine.createSpy('spy')
        spy('foo')
        expect(spy).toHaveBeenCalled()
        expect(spy).toHaveBeenCalledOnceWith('foo')
    })

    it('runs WebdriverIO matchers', async () => {
        await expect(browser).toHaveTitle('Jasmine Page')
        await expect(browser).toHaveTitle(expect.stringContaining('Jasmine'))
        await expect($('#heading')).toHaveText('Hello Jasmine')
        await expect($('#heading')).toHaveText(expect.oneOf('Hello Jasmine', 'Hello Mocha'))
        await expect($('#heading')).not.toHaveText('Goodbye')
        await expect($('#heading')).withContext('heading').toBeDisplayed()
        await expect($$('.item')).toBeElementsArrayOfSize(2)
    })

    it('uses the WebdriverIO toHaveSize for an element', async () => {
        await expect($('#box')).toHaveSize({ width: 120, height: 40 })
    })

    it('runs Jasmine async matchers', async () => {
        await expect(Promise.resolve(1)).toBeResolvedTo(1)
        await expectAsync(Promise.reject(new Error('boom'))).toBeRejectedWithError('boom')
    })
})
