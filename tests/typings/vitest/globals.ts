describe('vitest globals', () => {
    beforeEach(async () => {
        await browser.url('https://example.com')
    })

    afterEach(async () => {
        await browser.deleteCookies()
    })

    it('uses the WebdriverIO globals', async () => {
        const title: string = await browser.getTitle()
        expect(title).toBe('Example Domain')
        await expect($('h1')).toHaveText('Example Domain')
    })

    test('supports test', () => {
        expect(1 + 1).toBe(2)
    })
})

const config: WebdriverIO.Config = {
    vitestOpts: {
        testTimeout: 5000,
        parallelMode: 'contexts',
        maxParallelContexts: 2
    },
    capabilities: [{}]
}

const wrongMaxParallelContexts: WebdriverIO.Config = {
    vitestOpts: {
        // @ts-expect-error
        maxParallelContexts: 'wrong param'
    },
    capabilities: [{}]
}

const wrongParallelMode: WebdriverIO.Config = {
    vitestOpts: {
        // @ts-expect-error
        parallelMode: 'wrong param'
    },
    capabilities: [{}]
}
