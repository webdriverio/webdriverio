import { browser, expect } from '@wdio/globals'

describe('deepagent example', () => {
    it('loads a page the agent can traverse', async () => {
        await browser.url('data:text/html;charset=utf-8,<title>DeepAgent Example</title><h1>hello</h1>')
        await expect(browser).toHaveTitle('DeepAgent Example')
    })
})
