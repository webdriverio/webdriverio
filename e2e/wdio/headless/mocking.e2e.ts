import { browser } from '@wdio/globals'

describe('network mocking', () => {
    afterEach(async () => {
        await browser.mockRestoreAll()
    })

    it('marks a request as mocked even without overwrites', async () => {
        const baseUrl = 'https://guinea-pig.webdriver.io/'
        const mock = await browser.mock('https://cdn.jsdelivr.net/npm/hammerjs@1.1.3/hammer.min.js', {
            method: 'get',
            statusCode: 200,
        })
        await browser.url(baseUrl)
        await browser.waitUntil(() => mock.calls.length === 1, {
            timeoutMsg: 'Expected mock to be made',
            timeout: 2000
        })
    })

    it('should mock with wildcard (*) pattern', async () => {
        const baseUrl = 'https://guinea-pig.webdriver.io/'
        const mock = await browser.mock('https://cdn.jsdelivr.net/npm/jquery@3.6.0/*', {
            method: 'get',
            statusCode: 200,
        })
        await browser.url(baseUrl)
        await browser.execute(() => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js'
            document.body.appendChild(script)
        })
        await browser.waitUntil(() => mock.calls.length >= 1, {
            timeoutMsg: 'Expected wildcard mock to be called',
            timeout: 5000
        })
    })

    it('should mock with double wildcard (**) pattern', async () => {
        const mock = await browser.mock('https://cdn.jsdelivr.net/npm/vue@2.6.14/**', {
            method: 'get',
            statusCode: 200,
        })
        await browser.url('https://guinea-pig.webdriver.io/')
        await browser.execute(() => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js'
            document.body.appendChild(script)
        })
        await browser.waitUntil(() => mock.calls.length >= 1, {
            timeoutMsg: 'Expected double wildcard mock to be called',
            timeout: 5000
        })
    })

    it('should mock with wildcard in middle of path', async () => {
        const mock = await browser.mock('https://cdn.jsdelivr.net/npm/react@17.0.2/*/react.production.min.js', {
            method: 'get',
            statusCode: 200,
        })
        await browser.url('https://guinea-pig.webdriver.io/')
        await browser.execute(() => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/react@17.0.2/umd/react.production.min.js'
            document.body.appendChild(script)
        })
        await browser.waitUntil(() => mock.calls.length >= 1, {
            timeoutMsg: 'Expected middle wildcard mock to be called',
            timeout: 5000
        })
    })

    it('should mock with hostname wildcard', async () => {
        const mock = await browser.mock('https://*.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js', {
            method: 'get',
            statusCode: 200,
        })
        await browser.url('https://guinea-pig.webdriver.io/')
        await browser.execute(() => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js'
            document.body.appendChild(script)
        })
        await browser.waitUntil(() => mock.calls.length >= 1, {
            timeoutMsg: 'Expected hostname wildcard mock to be called',
            timeout: 5000
        })
    })

    it('should mock with file extension wildcard', async () => {
        const mock = await browser.mock('https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.*', {
            method: 'get',
            statusCode: 200,
        })
        await browser.url('https://guinea-pig.webdriver.io/')
        await browser.execute(() => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js'
            document.body.appendChild(script)
        })
        await browser.waitUntil(() => mock.calls.length >= 1, {
            timeoutMsg: 'Expected extension wildcard mock to be called',
            timeout: 5000
        })
    })

    it('should mock with complex mixed wildcards', async () => {
        // Matches https://cdn.jsdelivr.net/.../bootstrap.min.js
        const mock = await browser.mock('https://*.jsdelivr.net/**/bootstrap.min.js', {
            method: 'get',
            statusCode: 200,
        })
        await browser.url('https://guinea-pig.webdriver.io/')
        await browser.execute(() => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.min.js'
            document.body.appendChild(script)
        })
        await browser.waitUntil(() => mock.calls.length >= 1, {
            timeoutMsg: 'Expected complex wildcard mock to be called',
            timeout: 5000
        })
    })
})
