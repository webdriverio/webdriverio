import { Given, When } from '@wdio/cucumber-framework'
import { browser, $ } from '@wdio/globals'

import { COLORS } from './colorServer.js'

const urlOf = (from: string, to: string) => `${process.env.VIDEO_COLOR_ORIGIN}/${from}?to=${to}`
const colorsOf = (test: string) => COLORS[test as keyof typeof COLORS]

Given(/^I open the page of "([^"]+)"$/, async (test: string) => {
    const [from, to] = colorsOf(test)
    await browser.url(urlOf(from, to))
})

When(/^I wait (\d+) ms$/, async (ms: string) => {
    await browser.pause(Number(ms))
})

When(/^I click the button$/, async () => {
    await $('#btn').click()
})

// a tab of the scenario: its frames belong to the scenario
When(/^I click the button of "([^"]+)" in a new tab$/, async (test: string) => {
    const [from, to] = colorsOf(test)
    const tab = await browser.newWindow(urlOf(to, from), { type: 'tab' }) as WebdriverIO.BrowsingContext
    await tab.$('#btn').click()
    await tab.closeWindow()
})
