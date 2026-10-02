import { SessionError, usage } from '../errors.js'
import { quote } from '../quote.js'
import { refId } from './refs.js'
import type { Session } from '../session.js'

export interface ResolvedTarget {
    element: WebdriverIO.Element
    /**
     * selector used in emitted code (stable selector for refs)
     */
    selector: string
    /**
     * `$('<selector>')`
     */
    code: string
    /**
     * short description for output, e.g. `e3 (button "Add to cart")`
     */
    label: string
}

/**
 * The element of a ref or selector, without computing a selector for the
 * recorded code, e.g. for the scope of a snapshot.
 */
export async function resolveElement (session: Session, target: unknown): Promise<WebdriverIO.Element> {
    const id = typeof target === 'string' ? refId(target) : undefined
    if (id) {
        return session.refs.resolve(session.browser, id)
    }
    return (await resolveTarget(session, target)).element
}

/**
 * Resolve an action target: a ref from the latest snapshot or any
 * WebdriverIO selector matching exactly one element (RFC §4.6).
 */
export async function resolveTarget (session: Session, target: unknown): Promise<ResolvedTarget> {
    if (typeof target !== 'string' || !target) {
        throw usage('This action needs a target: a ref like e3 or a selector like "aria/Sign in".')
    }
    const id = refId(target)
    if (id) {
        const element = await session.refs.resolve(session.browser, id)
        const selector = await session.refs.stableSelector(session.browser, id, element)
        const entry = session.refs.get(id)!
        return {
            element,
            selector,
            code: `$(${quote(selector)})`,
            label: `${id} (${entry.role}${entry.name ? ` ${JSON.stringify(entry.name)}` : ''})`
        }
    }
    let element: WebdriverIO.Element
    try {
        element = await session.browser.$(target).getElement()
    } catch (err) {
        if ((err as Error).name === 'StrictSelectorError') {
            throw new SessionError('ELEMENT_NOT_FOUND', (err as Error).message.split('\n')[0], {
                hint: 'Use a ref from `wdio session snapshot` or a narrower selector.'
            })
        }
        throw err
    }
    if (!element.elementId) {
        throw new SessionError('ELEMENT_NOT_FOUND', `No element matches ${JSON.stringify(target)}.`, {
            hint: `Run \`wdio session find ${JSON.stringify(target.replace(/^aria\//, ''))}\` or take a new snapshot.`
        })
    }
    return { element, selector: target, code: `$(${quote(target)})`, label: JSON.stringify(target) }
}
