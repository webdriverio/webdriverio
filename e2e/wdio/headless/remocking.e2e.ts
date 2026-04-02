import { browser } from '@wdio/globals'

describe('remocking same URL', () => {
    afterEach(async () => {
        await browser.mockRestoreAll()
    })

    it('should allow mocking the same URL multiple times in a single test', async () => {
        const testUrl = 'https://guinea-pig.webdriver.io/'
        const mockUrl = '**/api/test'

        // First mock - respond with "response1"
        const firstMock = await browser.mock(mockUrl, { method: 'GET' })
        firstMock.respond({ data: 'response1' })

        await browser.url(testUrl)
        await browser.execute(() => {
            return fetch('/api/test')
                .then(res => res.json())
                .then(data => {
                    (window as Window & { firstResponse?: unknown }).firstResponse = data
                })
        })

        const firstResponse = await browser.execute(() => (window as Window & { firstResponse?: unknown }).firstResponse)
        expect(firstResponse).toEqual({ data: 'response1' })

        // Second mock - should override the first one and respond with "response2"
        const secondMock = await browser.mock(mockUrl, { method: 'GET' })
        secondMock.respond({ data: 'response2' })

        await browser.execute(() => {
            return fetch('/api/test')
                .then(res => res.json())
                .then(data => {
                    (window as Window & { secondResponse?: unknown }).secondResponse = data
                })
        })

        const secondResponse = await browser.execute(() => (window as Window & { secondResponse?: unknown }).secondResponse)
        expect(secondResponse).toEqual({ data: 'response2' })

        // Verify that the first mock was restored (should have been called once)
        expect(firstMock.calls.length).toBe(1)
        // Verify that the second mock is active (should have been called once)
        expect(secondMock.calls.length).toBe(1)
    })

    it('should allow mocking the same URL with different filter options simultaneously', async () => {
        const testUrl = 'https://guinea-pig.webdriver.io/'
        const mockUrl = '**/api/data'

        // Mock GET requests
        const getMock = await browser.mock(mockUrl, { method: 'GET' })
        getMock.respond({ method: 'GET', data: 'get-response' })

        // Mock POST requests (different filter, should coexist)
        const postMock = await browser.mock(mockUrl, { method: 'POST' })
        postMock.respond({ method: 'POST', data: 'post-response' })

        await browser.url(testUrl)

        // Test GET request
        await browser.execute(() => {
            return fetch('/api/data', { method: 'GET' })
                .then(res => res.json())
                .then(data => {
                    (window as Window & { getResponse?: unknown }).getResponse = data
                })
        })

        // Test POST request
        await browser.execute(() => {
            return fetch('/api/data', { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    (window as Window & { postResponse?: unknown }).postResponse = data
                })
        })

        const getResponse = await browser.execute(() => (window as Window & { getResponse?: unknown }).getResponse)
        const postResponse = await browser.execute(() => (window as Window & { postResponse?: unknown }).postResponse)

        expect(getResponse).toEqual({ method: 'GET', data: 'get-response' })
        expect(postResponse).toEqual({ method: 'POST', data: 'post-response' })

        // Both mocks should have been called once
        expect(getMock.calls.length).toBe(1)
        expect(postMock.calls.length).toBe(1)
    })

    it('should handle rapid remocking without state errors', async () => {
        const testUrl = 'https://guinea-pig.webdriver.io/'
        const mockUrl = '**/api/rapid'

        // Rapidly create and replace mocks
        for (let i = 0; i < 5; i++) {
            const mock = await browser.mock(mockUrl, { method: 'GET' })
            mock.respond({ iteration: i })
        }

        await browser.url(testUrl)

        // Only the last mock should be active
        await browser.execute(() => {
            return fetch('/api/rapid')
                .then(res => res.json())
                .then(data => {
                    (window as Window & { rapidResponse?: unknown }).rapidResponse = data
                })
        })

        const response = await browser.execute(() => (window as Window & { rapidResponse?: unknown }).rapidResponse)
        expect(response).toEqual({ iteration: 4 })
    })
})
