import DevToolsDriver from '../src/driver'

import puppeteer from 'puppeteer-core'
jest.mock('puppeteer-core')

test('getActivePage: returns existing page if existing', async () => {
    const driver = new DevToolsDriver()
    driver.page = 'foobar'
    expect(await driver.getActivePage()).toBe('foobar')
})

test('getCDPSession: returns existing page if existing', async () => {
    const driver = new DevToolsDriver()
    driver.cdpSession = 'foobar'
    expect(await driver.getCDPSession()).toBe('foobar')
})

test('send', async () => {
    const driver = new DevToolsDriver()
    driver.cdpSession = { send: jest.fn() }
    await driver.send('foo', 'bar')
    expect(driver.cdpSession.send).toBeCalledWith('foo', 'bar')
})

test('connect', async () => {
    const url = 'https://webdriver.io'
    const driver = await DevToolsDriver.attach(url)
    expect(driver.browser).toBeInstanceOf(puppeteer.PuppeteerMock)
    expect(puppeteer.connect).toBeCalledWith({ browserURL: url, defaultViewport: null })
})
