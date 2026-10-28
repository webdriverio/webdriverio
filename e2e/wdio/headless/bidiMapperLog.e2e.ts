import { browser, expect } from '@wdio/globals'

interface TargetInfo {
    targetId: string
    type: string
    title: string
}

const MAPPER_TITLE = 'BiDi-CDP Mapper'

// random pixels: the PNG does not compress, so its BiDi message is large
const NOISE_PAGE = 'data:text/html,<body style="margin:0"><canvas id=c width=455 height=455></canvas><script>' +
    'const c=document.getElementById("c").getContext("2d");const d=c.createImageData(455,455);' +
    'for(let i=0;i<d.data.length;i++)d.data[i]=i%4===3?255:Math.random()*256|0;c.putImageData(d,0,0)</script>'

/**
 * The page of the ChromeDriver BiDi Mapper is a hidden target. A script there
 * cannot return a value through the ChromeDriver CDP endpoint, so it writes the
 * result into the page title, and `Target.getTargets` reads it. This uses
 * another channel than `session/bidiMapperLog.ts` on purpose: a bug there must
 * not hide here.
 */
async function getMapperPage () {
    const targets = async () => (await browser.sendCommandAndGetResult('Target.getTargets', { filter: [{}] }) as { targetInfos: TargetInfo[] }).targetInfos
    const mapper = (await targets()).find(({ title, type }) => title === MAPPER_TITLE && type === 'other')
    expect(mapper).toBeDefined()
    const { sessionId } = await browser.sendCommandAndGetResult('Target.attachToTarget', { targetId: mapper!.targetId, flatten: false }) as { sessionId: string }
    const send = (id: number, expression: string) => browser.sendCommandAndGetResult('Target.sendMessageToTarget', {
        sessionId,
        message: JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression } })
    })
    try {
        await send(1, `document.title = '${MAPPER_TITLE} ' + JSON.stringify({ logs: Boolean(document.getElementById('logs')), size: document.documentElement.outerHTML.length })`)
        let title = ''
        await browser.waitUntil(async () => {
            title = (await targets()).find(({ targetId }) => targetId === mapper!.targetId)?.title ?? ''
            return title.startsWith(`${MAPPER_TITLE} {`)
        })
        return JSON.parse(title.slice(MAPPER_TITLE.length + 1)) as { logs: boolean, size: number }
    } finally {
        await send(2, `document.title = '${MAPPER_TITLE}'`)
        await browser.sendCommandAndGetResult('Target.detachFromTarget', { sessionId })
    }
}

// https://issues.chromium.org/issues/577213792
describe('ChromeDriver BiDi Mapper', () => {
    it('has no log in its page, so large BiDi messages do not slow down later commands', async () => {
        expect(browser.isBidi).toBe(true)
        await browser.url(NOISE_PAGE)
        const { data } = await browser.browsingContextCaptureScreenshot({ context: await browser.getWindowHandle() })
        expect(data.length).toBeGreaterThan(500_000)

        const page = await getMapperPage()
        expect(page.logs).toBe(false)
        // also when a Chrome update writes the log into another element
        expect(page.size).toBeLessThan(data.length / 10)
    })
})
