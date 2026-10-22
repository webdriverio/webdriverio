import { Given, When, Then, Before, After } from '@wdio/cucumber-framework'
import { browser } from '@wdio/globals'

import { log, logScreenshot, page, snap } from './parallelEvents.js'

const tag = (name: string) => name.match(/^(S\d+)/)?.[1] ?? '?'

Before(function (world) {
    log(`HB:${tag(world.pickle.name)}`)
})
After(function (world) {
    log(`HA:${tag(world.pickle.name)}`)
})

Given(/^(S\d+) opens (\w+)$/, async (t: string, color: string) => {
    log(`${t}:open`)
    await page(color)
})
When(/^(S\d+) waits (\d+) and logs$/, async (t: string, ms: string) => {
    log(`${t}:start`)
    await browser.pause(Number(ms))
    await snap(t)
})
Then(/^(S\d+) logs a screenshot$/, async (t: string) => {
    await logScreenshot(t)
    log(`${t}:end`)
})
Then(/^(S\d+) fails$/, (t: string) => {
    log(`${t}:end`)
    throw new Error(`${t} fails`)
})
