import { browser, expect } from '@wdio/globals'

interface TargetInfo {
    targetId: string
    type: string
    title: string
}

const MAPPER_TITLE = 'BiDi-CDP Mapper'

/**
 * The page of the ChromeDriver BiDi Mapper is a hidden target. A script there
 * cannot return a value through the ChromeDriver CDP endpoint, so it writes the
 * result into the page title, and `Target.getTargets` reads it. This is a copy
 * of the lookup in `session/bidiMapperLog.ts` on purpose: a bug there must not
 * hide here.
 */
async function hasMapperLog () {
    const targets = async () => (await browser.sendCommandAndGetResult('Target.getTargets', { filter: [{}] }) as { targetInfos: TargetInfo[] }).targetInfos
    const mapper = (await targets()).find(({ title, type }) => title === MAPPER_TITLE && type === 'other')
    expect(mapper).toBeDefined()
    const { sessionId } = await browser.sendCommandAndGetResult('Target.attachToTarget', { targetId: mapper!.targetId, flatten: false }) as { sessionId: string }
    const send = (id: number, expression: string) => browser.sendCommandAndGetResult('Target.sendMessageToTarget', {
        sessionId,
        message: JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression } })
    })
    try {
        await send(1, `document.title = '${MAPPER_TITLE} logs=' + Boolean(document.getElementById('logs'))`)
        let title = ''
        await browser.waitUntil(async () => {
            title = (await targets()).find(({ targetId }) => targetId === mapper!.targetId)?.title ?? ''
            return title.startsWith(`${MAPPER_TITLE} logs=`)
        })
        return title === `${MAPPER_TITLE} logs=true`
    } finally {
        await send(2, `document.title = '${MAPPER_TITLE}'`)
        await browser.sendCommandAndGetResult('Target.detachFromTarget', { sessionId })
    }
}

// https://issues.chromium.org/issues/577213792
describe('ChromeDriver BiDi Mapper', () => {
    it('has no log in its page, so large BiDi messages do not slow down later commands', async () => {
        expect(browser.isBidi).toBe(true)
        expect(await hasMapperLog()).toBe(false)
    })
})
