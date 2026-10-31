import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { startStandaloneChrome } from './helpers.js'

const PAGE = 'data:text/html,' + encodeURIComponent('<p id="a">wait</p><p id="b">wait</p>')

interface UserCommandEvent { id: number, command: string }
interface ProtocolEvent { command: string, endpoint?: string, parent?: number }

// WebDriver BiDi session with user command events: the element commands send HTTP requests, the children of the user command
describe('user commands that run at the same time', () => {
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        browser = await startStandaloneChrome({
            userCommandEvents: true,
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': { args: ['--headless=new', '--disable-gpu', '--use-mock-keychain', '--password-store=basic'] }
            }
        })
    })

    afterAll(async () => {
        await browser?.deleteSession()
    })

    test('each request gets the id of its own user command', async () => {
        await browser.url(PAGE)
        const a = await browser.$('#a')
        const b = await browser.$('#b')
        const userCommands: UserCommandEvent[] = []
        const requests: [string, ProtocolEvent][] = []
        browser.on('userCommand', (event: UserCommandEvent) => userCommands.push(event))
        browser.on('command', (event: ProtocolEvent) => requests.push(['command', event]))
        browser.on('result', (event: ProtocolEvent) => requests.push(['result', event]))
        // b gets its text first, a later: the polls of a go on after b ends
        await browser.execute(() => {
            setTimeout(() => { document.getElementById('b')!.textContent = 'B' }, 500)
            setTimeout(() => { document.getElementById('a')!.textContent = 'A' }, 1500)
        })

        await Promise.all([
            browser.waitUntil(async () => (await a.getText()) === 'A', { timeout: 10000, interval: 50 }),
            browser.waitUntil(async () => (await b.getText()) === 'B', { timeout: 10000, interval: 50 })
        ])

        const waits = userCommands.filter(({ command }) => command === 'waitUntil')
        expect(waits).toHaveLength(2)
        const [idOfA, idOfB] = waits.map(({ id }) => id)
        const textRequests = requests.filter(([, { command }]) => command === 'getElementText')
        const parentOf = (element: WebdriverIO.Element) => textRequests
            .filter(([, { endpoint }]) => endpoint?.includes(`/element/${element.elementId}/`))
            .map(([event, { parent }]) => [event, parent])
        expect(parentOf(a).length).toBeGreaterThan(2)
        expect(parentOf(b).length).toBeGreaterThan(0)
        expect(parentOf(a).every(([, parent]) => parent === idOfA)).toBe(true)
        expect(parentOf(b).every(([, parent]) => parent === idOfB)).toBe(true)
        expect(parentOf(a).length + parentOf(b).length).toBe(textRequests.length)

        // the polls of the two waits overlap: a poll of b comes before the last poll of a
        const order = textRequests.map(([, { parent }]) => parent)
        expect(order.indexOf(idOfB)).toBeLessThan(order.lastIndexOf(idOfA))
    })
})
