import { Given, BeforeAll, Before, After, AfterAll } from '../../../packages/wdio-cucumber-framework/build/index.js'

browser.addCommand('rootLevel', () => {
    return true
})

BeforeAll(async () => {
    // defined and modified in hooks
    expect(browser.Cucumber_Test).toBe(0)

    // should resolve promises
    expect(await browser.pause(1)).toBe(undefined)

    expect(await browser.rootLevel()).toBe(true)
})
Before(async function (scenario) {
    // defined and modified in hooks
    expect(browser.Cucumber_Test).toBe(1)

    expect(Array.isArray(scenario.pickle.tags)).toBe(true)

    // World
    expect(typeof this.attach).toBe('function')

    // should resolve promises
    expect(await browser.pause(1)).toBe(undefined)
})
After(async function (scenario) {
    // defined and modified in hooks
    expect(browser.Cucumber_Test).toBe(1)

    expect(typeof this.attach).toBe('function')

    // World
    expect(Array.isArray(scenario.pickle.tags)).toBe(true)

    // should resolve promises
    expect(await browser.pause(1)).toBe(undefined)
})
AfterAll(async () => {
    // defined and modified in hooks
    expect(browser.Cucumber_Test).toBe(-1)

    // should resolve promises
    expect(await browser.pause(1)).toBe(undefined)
})

Given('I choose the {string} scenario', { retry: { wrapperOptions: { retry: 1 } } }, async (scenario) => {
    if (typeof browser[scenario] !== 'function') {
        throw new Error(`Scenario with name "${scenario}" is not defined`)
    }

    await browser[scenario]()
})

const stepText = 'I go on the website'
Given(`${stepText} {string}`, async function (url) {
    // World
    expect(typeof this.attach).toBe('function')
    expect(browser.Cucumber_CurrentStepText.startsWith(stepText)).toBe(true)

    await browser.url(url)
})

Given('I click on link {string}', async (selector) => {
    const elem = await browser.$(selector)

    expect(browser.Cucumber_Test).toBe(3)

    await elem.click()
})

let foobarCounter = 1
Given(/^Foo (.*) and Bar (.*) are passed$/, async function (foo, bar) {
    expect(foo).toBe('f' + foobarCounter)
    expect(bar).toBe('b' + foobarCounter)
    foobarCounter++
})

Given(/^a table step$/, async function (table) {
    const expected = [
        ['Apricot', '5'],
        ['Brocolli', '2'],
        ['Cucumber', '10']
    ]
    expect(table.rows()).toEqual(expected)
})

Given('this is ambiguous', () => {
})
