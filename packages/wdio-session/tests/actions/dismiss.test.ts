/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest'

import { click } from '../../src/actions/interact.js'
import { cliCmd } from '../../src/hints.js'
import type { Session } from '../../src/session.js'

/** the in-page callback of `click`, run on a jsdom page whose layout is faked */
async function hintFor (banner: string, attrs = 'id="cookie-banner" role="dialog"') {
    document.body.innerHTML = `<button id="target">Pay</button><div ${attrs}>${banner}</div>`
    const cover = document.body.lastElementChild!
    const target = document.getElementById('target')!
    document.elementFromPoint = () => cover
    HTMLElement.prototype.scrollIntoView = () => {}
    Element.prototype.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 }) as DOMRect
    const element = {
        execute: async (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => fn(target, ...args),
        click: async () => { throw new Error('should not click') }
    }
    const session = {
        cmd: cliCmd,
        currentUrl: async () => 'https://a.test/',
        browser: {},
        refs: {
            resolve: async () => element,
            stableSelector: async () => 'button',
            get: () => ({ id: 'e2', kind: 'web', role: 'button', name: 'Pay', candidates: [], generation: 1 })
        }
    } as unknown as Session
    const err = await click(session, { target: 'e2', $cwd: '/' }).catch((e) => e)
    return err.hint as string
}

describe('the control a covered click names', () => {
    beforeEach(() => {
        Object.defineProperty(HTMLElement.prototype, 'innerText', { configurable: true, get () { return this.textContent } })
    })

    it('skips disabled controls: attribute, aria-disabled and a disabled fieldset', async () => {
        const banners = [
            '<button disabled>Reject all</button><button>Accept all</button>',
            '<button aria-disabled="true">Reject all</button><button>Accept all</button>',
            '<fieldset disabled><button>Reject all</button></fieldset><button>Accept all</button>'
        ]
        for (const banner of banners) {
            expect(await hintFor(banner)).toBe('Close or dismiss what is on top first (a cookie banner, dialog or popup), or scroll so the element is free.')
        }
    })

    it('still prefers an enabled rejecting control', async () => {
        expect(await hintFor('<button>Accept all</button><button>Reject all</button>')).toBe('Close it first: button "Reject all".')
    })

    it('finds a banner by its cookie id when it has no dialog role', async () => {
        expect(await hintFor('<button>Reject all</button><button>Accept all</button>', 'id="cookie-banner"')).toBe('Close it first: button "Reject all".')
    })

    it('finds a banner by its cookie class', async () => {
        expect(await hintFor('<button>Accept all</button><button>Reject all</button>', 'id="x1" class="cookie-banner"')).toBe('Close it first: button "Reject all".')
    })

    it('gives the generic hint for an unmarked wrapper', async () => {
        expect(await hintFor('<button>Close</button>', 'id="promo"')).toBe('Close or dismiss what is on top first (a cookie banner, dialog or popup), or scroll so the element is free.')
    })

    it('never names an accepting control', async () => {
        expect(await hintFor('<button>Accept all</button><button>Got it</button>')).toBe('Close or dismiss what is on top first (a cookie banner, dialog or popup), or scroll so the element is free.')
    })
})
