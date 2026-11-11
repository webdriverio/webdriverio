import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { multiRemoteBrowser, expect } from '@wdio/globals'

import { row, type Item } from './missingListItemOutcome.js'

const PAGE = `
<title>Multi-remote missing list item</title>
<ul id="list"><li>i0</li><li>i1</li><li>i2</li></ul>
<script>
    window.setList = (count) => {
        document.getElementById('list').innerHTML = Array.from({ length: count }, (_, i) => '<li>i' + i + '</li>').join('')
    }
</script>
`

const WAIT = 200
const INSTANCES = ['browserA', 'browserB', 'browserC'] as const

const CHECKS = {
    'isExisting': (item: Item) => item.isExisting(),
    'isDisplayed': (item: Item) => item.isDisplayed(),
    'waitForDisplayed reverse': (item: Item) => item.waitForDisplayed({ reverse: true, timeout: WAIT }),
    'getText': (item: Item) => item.getText(),
    'click': (item: Item) => item.click(),
    'not.toExist': (item: Item) => expect(item).not.toExist({ wait: WAIT }),
    'not.toBeDisplayed': (item: Item) => expect(item).not.toBeDisplayed({ wait: WAIT }),
    'toExist': (item: Item) => expect(item).toExist({ wait: WAIT }),
    /**
     * found or not found, per instance
     */
    'instances': async (item: Item) => {
        const element = await item as unknown as WebdriverIO.MultiRemoteElement
        return element.instances.map((name) => `${name}: ${element.getInstance(name).elementId ? 'found' : 'not found'}`)
    },
}
type Row = Record<keyof typeof CHECKS, string>

const every = (label: string) => Object.fromEntries(Object.keys(CHECKS).map((check) => [check, label])) as Row
const perInstance = (names: readonly string[], value: unknown) => JSON.stringify(names.map(() => value))

const notFoundIn = (names: readonly string[], commandError: string): Row => ({
    'isExisting': perInstance(names, false),
    'isDisplayed': perInstance(names, false),
    'waitForDisplayed reverse': perInstance(names, true),
    'getText': commandError,
    'click': commandError,
    'not.toExist': 'ok',
    'not.toBeDisplayed': 'ok',
    'toExist': 'assertion fails',
    'instances': JSON.stringify(names.map((name) => `${name}: not found`)),
})

/**
 * the reference: a multi-remote `$('#missing')`
 */
const REFERENCE = notFoundIn(INSTANCES, 'can\'t call getText on #missing')
REFERENCE.click = 'can\'t call click on #missing'

/**
 * A baseline of the multi-remote lists for an index that the list never reaches
 * (#12576), compared with a multi-remote `$('#missing')`. Each check runs on a new item.
 */
describe('multi-remote: an index that the list never reaches', () => {
    let server: Server
    let waitforTimeouts: Array<number | undefined>

    const setLists = (counts: Record<typeof INSTANCES[number], number>) => Promise.all(INSTANCES.map((name) => (
        multiRemoteBrowser.getInstance(name).execute((count) => (window as unknown as { setList (count: number): void }).setList(count), counts[name])
    )))

    before(async () => {
        server = createServer((_, response) => {
            response.setHeader('Content-Type', 'text/html; charset=utf-8')
            response.end(PAGE)
        })
        server.listen(0, '127.0.0.1')
        await once(server, 'listening')
        waitforTimeouts = INSTANCES.map((name) => multiRemoteBrowser.getInstance(name).options.waitforTimeout)
        for (const name of INSTANCES) {
            multiRemoteBrowser.getInstance(name).options.waitforTimeout = WAIT
        }
        await multiRemoteBrowser.url(`http://127.0.0.1:${(server.address() as AddressInfo).port}/`)
        await multiRemoteBrowser.addLocatorStrategy('multiRemoteItems', () => [...document.querySelectorAll<HTMLElement>('#list li')])
    })

    after(async () => {
        INSTANCES.forEach((name, index) => {
            multiRemoteBrowser.getInstance(name).options.waitforTimeout = waitforTimeouts[index]
        })
        const closed = new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
        server.closeAllConnections()
        await closed
    })

    const item = (value: unknown): [Item] => [value as Item]
    const ENTRIES: Array<[string, Record<typeof INSTANCES[number], number>, () => Promise<[Item]> | [Item], Row]> = [
        ['reference: $(\'#missing\')', { browserA: 3, browserB: 3, browserC: 3 }, () => item(multiRemoteBrowser.$('#missing')), REFERENCE],
        ['every list has 3 items: $$(selector)[5]', { browserA: 3, browserB: 3, browserC: 3 }, () => item(multiRemoteBrowser.$$('#list li')[5]), notFoundIn(INSTANCES, 'Index out of bounds')],
        ['every list has 3 items: (await $$(selector))[5]', { browserA: 3, browserB: 3, browserC: 3 }, async () => item((await multiRemoteBrowser.$$('#list li'))[5]), notFoundIn(INSTANCES, 'Index out of bounds')],
        ['every list has 3 items: $(parent).$$(selector)[5]', { browserA: 3, browserB: 3, browserC: 3 }, () => item(multiRemoteBrowser.$('#list').$$('li')[5]), notFoundIn(INSTANCES, 'Index out of bounds')],
        ['every list has 3 items: custom$$(strategy)[5]', { browserA: 3, browserB: 3, browserC: 3 }, () => item(multiRemoteBrowser.custom$$('multiRemoteItems')[5]), notFoundIn(INSTANCES, 'Index out of bounds')],
        ['every list has 3 items: select(browserB).$$(selector)[5]', { browserA: 3, browserB: 3, browserC: 3 }, () => item(multiRemoteBrowser.select('browserB').$$('#list li')[5]), notFoundIn(['browserB'], 'Index out of bounds')],
        ['the lists have 2, 3 and 1 items: $$(selector)[5]', { browserA: 2, browserB: 3, browserC: 1 }, () => item(multiRemoteBrowser.$$('#list li')[5]), notFoundIn(INSTANCES, 'Index out of bounds')],
        /**
         * current behavior, a follow-up decides it: the index is in the range of the longest
         * list, so there is no wait, and the instances with a shorter list are left out of
         * the item (#15846)
         */
        ['the lists have 6, 3 and 3 items: $$(selector)[5]', { browserA: 6, browserB: 3, browserC: 3 }, () => item(multiRemoteBrowser.$$('#list li')[5]), {
            ...every('no instance browserB'),
            'not.toExist': 'assertion fails',
            'not.toBeDisplayed': 'assertion fails',
            'toExist': 'assertion fails',
        }],
        ['the lists have 3, 6 and 3 items: $$(selector)[5]', { browserA: 3, browserB: 6, browserC: 3 }, () => item(multiRemoteBrowser.$$('#list li')[5]), {
            ...every('no instance browserA'),
            'not.toExist': 'assertion fails',
            'not.toBeDisplayed': 'assertion fails',
            'toExist': 'assertion fails',
        }],
        ['the lists have 6, 0 and 0 items: $$(selector)[0]', { browserA: 6, browserB: 0, browserC: 0 }, () => item(multiRemoteBrowser.$$('#list li')[0]), {
            ...every('no instance browserB'),
            'not.toExist': 'assertion fails',
            'not.toBeDisplayed': 'assertion fails',
            'toExist': 'assertion fails',
        }],
    ]

    for (const [name, counts, entry, expected] of ENTRIES) {
        it(name, async () => {
            const result = {} as Row
            for (const [check, run] of Object.entries(CHECKS)) {
                await setLists(counts)
                Object.assign(result, await row(entry, { [check]: run }))
            }
            expect(result).toEqual(expected)
        })
    }

    it('uses the not found item of every instance once its list reaches the index', async () => {
        await setLists({ browserA: 3, browserB: 3, browserC: 3 })
        const late = multiRemoteBrowser.$$('#list li')[5]
        expect(await late.isExisting()).toEqual([false, false, false])
        await setLists({ browserA: 6, browserB: 6, browserC: 6 })

        expect(await late.isExisting()).toEqual([true, true, true])
        expect(await late.getText()).toEqual(['i5', 'i5', 'i5'])
    })
})
