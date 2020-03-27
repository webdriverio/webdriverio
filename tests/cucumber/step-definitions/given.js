// eslint-disable-next-line
import assert from 'assert'
import { Given, BeforeAll, Before, After, AfterAll } from 'cucumber'

browser.addCommand('rootLevel', () => {
    return true
})

BeforeAll(() => {
    // defined and modified in hooks
    assert.equal(browser.Cucumber_Test, 0)

    // should resolve promises
    assert.strictEqual(browser.pause(1), undefined)

    assert.strictEqual(browser.rootLevel(), true)
})
Before(function (scenario) {
    // defined and modified in hooks
    assert.equal(browser.Cucumber_Test, 1)

    assert.strictEqual(Array.isArray(scenario.pickle.tags), true)

    // World
    assert.strictEqual(typeof this.attach, 'function')

    // should resolve promises
    assert.strictEqual(browser.pause(1), undefined)
})
After(function (scenario) {
    // defined and modified in hooks
    assert.equal(browser.Cucumber_Test, 1)

    assert.strictEqual(typeof this.attach, 'function')

    // World
    assert.strictEqual(Array.isArray(scenario.pickle.tags), true)

    // should resolve promises
    assert.strictEqual(browser.pause(1), undefined)
})
AfterAll(() => {
    // defined and modified in hooks
    assert.equal(browser.Cucumber_Test, -1)

    // should resolve promises
    assert.strictEqual(browser.pause(1), undefined)
})

Given('I choose the {string} scenario', { retry: { wrapperOptions: { retry: 1 } } }, (scenario) => {
    if (typeof browser[scenario] !== 'function') {
        throw new Error(`Scenario with name "${scenario}" is not defined`)
    }

    browser[scenario]()
})

const stepText = 'I go on the website'
Given(`${stepText} {string}`, function (url) {
    // World
    assert.strictEqual(typeof this.attach, 'function')
    assert.strictEqual(browser.Cucumber_CurrentStepText.startsWith(stepText), true)
    assert.strictEqual(browser.Cucumber_CurrentWorld, this)

    browser.url(url)
})

Given('I click on link {string}', (selector) => {
    const elem = browser.$(selector)

    assert.equal(browser.Cucumber_Test, 3)

    elem.click()
})

Given('I click on link {string} async', async (selector) => {
    const elem = await browser.$(selector)
    await elem.click()

    assert.equal(browser.Cucumber_Test, 3)
})

let foobarCounter = 1
Given(/^Foo (.*) and Bar (.*) are passed$/, function (foo, bar) {
    assert.equal(foo, 'f' + foobarCounter)
    assert.equal(bar, 'b' + foobarCounter)
    foobarCounter++
})

Given(/^a table step$/, function(table) {
    const expected = [
        ['Apricot', '5'],
        ['Brocolli', '2'],
        ['Cucumber', '10']
    ]
    assert.deepEqual(table.rows(), expected)
})

Given('this is ambiguous', () => {
})
