import { expectType } from 'tsd'
import { $, $$, browser, driver, multiremotebrowser } from '@wdio/globals'
import { fn, spyOn, mock, unmock, mocked } from '@wdio/browser-runner'

;(async () => {
    const elem = await $('foo')
    expectType<string>(elem.elementId)
    const label = await $('foo').$('bar').getComputedLabel()
    expectType<string>(label)

    const elems = await $$('foo')
    expectType<string>(elems.foundWith)
    const tagNames = await $$('foo').map((el) => el.getTagName())
    expectType<string[]>(tagNames)

    const title = await browser.getTitle()
    expectType<string>(title)
    const anotherTitle = await driver.getTitle()
    expectType<string>(anotherTitle)

    const multiTitle = await multiremotebrowser.getTitle()
    expectType<string[]>(multiTitle)

    expectType<Function>(fn)
    expectType<Function>(spyOn)

    mock('foobar', (importOrig) => {
        expectType<Promise<unknown>>(importOrig())
        return { default: 'foobar' }
    })
    unmock('foobar')
    expectType<[string][]>(mocked((foo: string) => 'bar').mock.calls)
})
