import { usage } from '../errors.js'
import { quote } from '../daemon/init.js'
import { resolveTarget } from '../snapshot/target.js'
import type { ActionFn, ActionOutcome, Session } from '../session.js'

const read = (text: string, code: string, data?: Record<string, unknown>): ActionOutcome => ({
    text,
    code,
    ...(data ? { data } : {})
})

async function targetOf (session: Session, value: unknown) {
    return resolveTarget(session, value)
}

export const get: ActionFn = async (session, args) => {
    const sub = String(args.sub ?? '')
    if (sub === 'title') {
        const title = await session.browser.getTitle()
        return read(title, 'await browser.getTitle()', { title })
    }
    if (sub === 'url') {
        const url = await session.browser.getUrl()
        return read(url, 'await browser.getUrl()', { url })
    }
    if (sub === 'count') {
        const selector = String(args.target ?? '')
        if (!selector) {
            throw usage('Pass a selector.', 'Example: wdio session get count "aria/button"')
        }
        const elements = await session.browser.$$(selector)
        const count = elements.length
        return read(String(count), `await $$(${quote(selector)}).length`, { count })
    }

    const needsTarget = new Set(['text', 'html', 'value', 'attr', 'box'])
    if (!needsTarget.has(sub)) {
        throw usage(`Unknown get "${sub}".`, 'Use text, html, value, attr, title, url, count or box.')
    }
    const target = await targetOf(session, args.target)
    if (sub === 'text') {
        const text = await target.element.getText()
        return read(text, `await ${target.code}.getText()`, { text })
    }
    if (sub === 'html') {
        const html = await target.element.getHTML({ includeSelectorTag: false, prettify: false })
        return read(html, `await ${target.code}.getHTML({ includeSelectorTag: false, prettify: false })`, { html })
    }
    if (sub === 'value') {
        const value = await target.element.getValue()
        return read(value, `await ${target.code}.getValue()`, { value })
    }
    if (sub === 'attr') {
        const name = String(args.name ?? '')
        if (!name) {
            throw usage('Pass an attribute name.', 'Example: wdio session get attr e3 href')
        }
        const value = await target.element.getAttribute(name)
        return read(value ?? '', `await ${target.code}.getAttribute(${quote(name)})`, { name, value })
    }
    const location = await target.element.getLocation()
    const size = await target.element.getSize()
    const box = { x: location.x, y: location.y, width: size.width, height: size.height }
    return read(`${box.x},${box.y} ${box.width}x${box.height}`, `await ${target.code}.getLocation(); await ${target.code}.getSize()`, { box })
}

const IS_COMMANDS = {
    visible: ['isDisplayed', 'visible'],
    enabled: ['isEnabled', 'enabled'],
    checked: ['isSelected', 'checked']
} as const

export const is: ActionFn = async (session, args) => {
    const sub = String(args.sub ?? '') as keyof typeof IS_COMMANDS
    const command = IS_COMMANDS[sub]
    if (!command) {
        throw usage(`Unknown is "${sub}".`, 'Use visible, enabled or checked.')
    }
    const target = await targetOf(session, args.target)
    const value = await target.element[command[0]]()
    return read(String(value), `await ${target.code}.${command[0]}()`, { [command[1]]: value })
}
