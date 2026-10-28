import { describe, expect, it } from 'vitest'

/**
 * from the source: the `@wdio/utils` entry point needs Node.js
 */
import { knownRoles, roleTable } from '../../wdio-utils/src/roles.js'
import { attachSelectors } from '../src/selectors.js'
import { collectInPage, type CollectOptions } from '../src/web.js'

/**
 * Runs the collector in a real browser the way a session does: from its
 * source, so it cannot rely on anything outside its body.
 */
function candidatesOf (html: string) {
    document.body.innerHTML = html
    const collect = new Function(`return (${collectInPage.toString()})`)() as typeof collectInPage
    const opts: CollectOptions = { roles: roleTable(), knownRoles: knownRoles(), counter: 0, all: false, boxes: false, assignRefs: true }
    const { refs } = collect(opts)
    return (role: string, name: string) => refs.find((ref) => ref.role === role && ref.name === name)?.candidates.map((c) => c.selector)
}

function taggedCandidatesOf (html: string, role: string, name: string, extendedCandidates = false) {
    document.body.innerHTML = html
    const collect = new Function(`return (${collectInPage.toString()})`)() as typeof collectInPage
    const { refs } = collect({ roles: roleTable(), knownRoles: knownRoles(), counter: 0, all: false, boxes: false, assignRefs: true, extendedCandidates })
    return refs.find((ref) => ref.role === role && (ref.name ?? '') === name)?.candidates
}

describe('snapshot selector candidates', () => {
    it('suggests role/<role>[name="..."] before aria/<name> for a unique role and name', () => {
        const candidates = candidatesOf('<button>Add to cart</button>')
        expect(candidates('button', 'Add to cart')?.slice(0, 2)).toEqual([
            'role/button[name="Add to cart"]',
            'aria/Add to cart'
        ])
    })

    it('keeps test ids first', () => {
        const candidates = candidatesOf('<button data-testid="add">Add to cart</button>')
        expect(candidates('button', 'Add to cart')?.slice(0, 2)).toEqual([
            '[data-testid="add"]',
            'role/button[name="Add to cart"]'
        ])
    })

    it('uses the role to tell apart elements that share a name', () => {
        const candidates = candidatesOf('<button>Help</button><a href="/help">Help</a>')
        expect(candidates('button', 'Help')).toContain('role/button[name="Help"]')
        expect(candidates('link', 'Help')).toContain('role/link[name="Help"]')
        expect(candidates('button', 'Help')).not.toContain('aria/Help')
    })

    it('leaves out the role selector when role and name are not unique', () => {
        const candidates = candidatesOf('<button>Remove</button><button>Remove</button>')
        expect(candidates('button', 'Remove')?.some((candidate) => candidate.startsWith('role/'))).toBe(false)
    })

    it('counts elements the snapshot does not walk into, e.g. an image inside a named button', () => {
        const candidates = candidatesOf('<img alt="Save" width="16" height="16"><button><img alt="Save" width="16" height="16"></button>')
        expect(candidates('img', 'Save')?.some((candidate) => candidate.startsWith('role/'))).toBe(false)
    })

    it('suggests no role selector for a role the selector does not accept', () => {
        const candidates = candidatesOf('<div role="bogus" tabindex="0" aria-label="Unique action">Unique action</div>')
        expect(candidates('bogus', 'Unique action')).toBeDefined()
        expect(candidates('bogus', 'Unique action')?.some((candidate) => candidate.startsWith('role/'))).toBe(false)
    })

    it('does not count a light DOM child of a shadow host that no slot takes', () => {
        document.body.innerHTML = ''
        const host = document.createElement('div')
        host.innerHTML = '<button>Pay now</button>'
        document.body.appendChild(host)
        host.attachShadow({ mode: 'open' }).innerHTML = '<button>Pay now</button>'
        const collect = new Function(`return (${collectInPage.toString()})`)() as typeof collectInPage
        const { refs } = collect({ roles: roleTable(), knownRoles: knownRoles(), counter: 0, all: false, boxes: false, assignRefs: true })
        const payNow = refs.filter((ref) => ref.role === 'button' && ref.name === 'Pay now')
        expect(payNow).toHaveLength(1)
        expect(payNow[0].candidates).toContainEqual({ kind: 'role', selector: 'role/button[name="Pay now"]' })
    })

    it('escapes quotes and backslashes in role/ names, keeping aria/ unescaped', () => {
        const candidates = candidatesOf('<button>Say "hi" \\ bye</button>')
        expect(candidates('button', 'Say "hi" \\ bye')).toContain('role/button[name="Say \\"hi\\" \\\\ bye"]')
        expect(candidates('button', 'Say "hi" \\ bye')).toContain('aria/Say "hi" \\ bye')
    })

    it('has no tag=text candidate for identical buttons and falls back to the positional path', () => {
        document.body.innerHTML = '<main><button>Add to cart</button><button>Add to cart</button><button>Add to cart</button></main>'
        const collect = new Function(`return (${collectInPage.toString()})`)() as typeof collectInPage
        const { refs } = collect({ roles: roleTable(), knownRoles: knownRoles(), counter: 0, all: false, boxes: false, assignRefs: true })
        const buttons = refs.filter((ref) => ref.role === 'button')
        expect(buttons).toHaveLength(3)
        for (const [i, ref] of buttons.entries()) {
            expect(ref.candidates.some((candidate) => candidate.selector.startsWith('button='))).toBe(false)
            expect(ref.candidates).toEqual([{ kind: 'css-path', selector: `main > button:nth-of-type(${i + 1})` }])
        }
        const tree = { role: 'document', children: buttons.map((ref) => ({ role: 'button', name: ref.name, ref: ref.id })) }
        attachSelectors(tree, buttons)
        expect(tree.children.map((child) => (child as { selectorPositional?: boolean }).selectorPositional)).toEqual([true, true, true])
    })

    it('keeps the tag=text candidate for a unique label that no better selector names', () => {
        const candidates = candidatesOf('<a href="/x">Docs</a>')
        expect(candidates('link', 'Docs')).toContain('a=Docs')
    })

    it('has no aria/ candidate for a name another element of any role shares', () => {
        const candidates = candidatesOf('<button>Search</button><div aria-label="Search">x</div>')
        expect(candidates('button', 'Search')).not.toContain('aria/Search')
    })

    it('keeps every base kind but adds no extended kind once MAX_CANDIDATES unique ones exist', () => {
        const html = '<main><button id="add" name="go" type="submit" aria-label="Go" class="btn primary">Add</button></main>'
        const expected = ['role', 'aria', 'id', 'name', 'css-path']
        expect(taggedCandidatesOf(html, 'button', 'Go')?.map((c) => c.kind)).toEqual(expected)
        expect(taggedCandidatesOf(html, 'button', 'Go', true)?.map((c) => c.kind)).toEqual(expected)
    })

    it('tags test ids and text', () => {
        expect(taggedCandidatesOf('<button data-testid="add">Add</button>', 'button', 'Add')?.[0]).toEqual({ kind: 'testid', selector: '[data-testid="add"]' })
        expect(taggedCandidatesOf('<a href="/x">Docs</a>', 'link', 'Docs')?.map((c) => c.kind)).toContain('text')
    })

    const NAMED_DIV = '<div tabindex="0" aria-label="Go" class="btn primary">Docs</div>'

    it('adds no aria-label, type, class or xpath-text candidate unless extendedCandidates is on', () => {
        const kinds = (html: string, role: string, name: string, extended: boolean) => taggedCandidatesOf(html, role, name, extended)?.map((c) => c.kind)
        const extendedKinds = ['aria-label', 'type', 'class', 'xpath-text']
        for (const [html, role, name] of [[NAMED_DIV, 'generic', 'Go'], ['<input type="email" class="f">', 'textbox', ''], [`${NAMED_DIV}<span aria-label="Go">x</span>`, 'generic', 'Go']]) {
            expect(kinds(html, role, name, false)?.some((kind) => extendedKinds.includes(kind as string))).toBe(false)
            expect(kinds(html, role, name, true)?.some((kind) => extendedKinds.includes(kind as string))).toBe(true)
        }
    })

    it('tags aria-label, type and class with extendedCandidates', () => {
        expect(taggedCandidatesOf(NAMED_DIV, 'generic', 'Go', true)).toEqual([
            { kind: 'aria', selector: 'aria/Go' },
            { kind: 'aria-label', selector: '[aria-label="Go"]' },
            { kind: 'class', selector: 'div.btn' },
            { kind: 'css-path', selector: 'div' }
        ])
        expect(taggedCandidatesOf('<input type="email" class="f">', 'textbox', '', true)).toEqual([
            { kind: 'type', selector: 'input[type="email"]' },
            { kind: 'class', selector: 'input.f' },
            { kind: 'css-path', selector: 'input' }
        ])
    })

    it('adds xpath-text only when no other unique candidate was found', () => {
        const twinned = '<div tabindex="0" aria-label="Go">Docs</div><span aria-label="Go">x</span>'
        expect(taggedCandidatesOf(twinned, 'generic', 'Go', true)?.map((c) => c.kind)).toEqual(['xpath-text', 'css-path'])
        expect(taggedCandidatesOf(NAMED_DIV, 'generic', 'Go', true)?.some((c) => c.kind === 'xpath-text')).toBe(false)
    })

    it('offers no xpath-text for an element in a shadow root, which another element of the document matches', () => {
        document.body.innerHTML = '<div>Docs</div>'
        const host = document.createElement('section')
        document.body.appendChild(host)
        host.attachShadow({ mode: 'open' }).innerHTML = '<div tabindex="0">Docs</div>'
        const collect = new Function(`return (${collectInPage.toString()})`)() as typeof collectInPage
        const { refs } = collect({ roles: roleTable(), knownRoles: knownRoles(), counter: 0, all: false, boxes: false, assignRefs: true, extendedCandidates: true })
        expect(refs).toHaveLength(1)
        expect(refs[0].candidates.map((c) => c.kind)).not.toContain('xpath-text')
    })

    it('skips generated-looking classes and non-unique types and classes', () => {
        const generated = taggedCandidatesOf('<button class="css-1a2b3c4d">Solo</button>', 'button', 'Solo', true)
        expect(generated?.some((c) => c.kind === 'class')).toBe(false)
        const twins = taggedCandidatesOf('<input type="text" class="f" aria-label="One"><input type="text" class="f" aria-label="Two">', 'textbox', 'One', true)
        expect(twins?.some((c) => c.kind === 'type' || c.kind === 'class')).toBe(false)
    })

    it('quotes xpath text with either quote kind, and skips text with both', () => {
        const twinned = (text: string) => `<div tabindex="0" aria-label="Go">${text}</div><span aria-label="Go">x</span>`
        expect(taggedCandidatesOf(twinned('Don\'t'), 'generic', 'Go', true)).toContainEqual({ kind: 'xpath-text', selector: '//div[contains(., "Don\'t")]' })
        expect(taggedCandidatesOf(twinned('Say "hi"'), 'generic', 'Go', true)).toContainEqual({ kind: 'xpath-text', selector: '//div[contains(., \'Say "hi"\')]' })
        expect(taggedCandidatesOf(twinned('It\'s "x"'), 'generic', 'Go', true)?.some((c) => c.kind === 'xpath-text')).toBe(false)
    })

    it('skips role/ and aria/ candidate when content has leading or trailing whitespace or icon/svg to avoid BiDi mismatch', () => {
        // Leading icon markup
        const linkHtml = '<a href="/logout" class="button"><i class="icon-signout" style="display:inline-block;width:10px;height:10px;background:#000"></i> Logout</a>'
        const linkCandidates = candidatesOf(linkHtml)('link', 'Logout')
        expect(linkCandidates).toBeDefined()
        expect(linkCandidates?.some((c) => c.startsWith('role/'))).toBe(false)
        expect(linkCandidates?.some((c) => c.startsWith('aria/'))).toBe(false)
        expect(linkCandidates).toContain('a=Logout')

        // Trailing whitespace from following icon/svg (docs footer case from #16095)
        const trailHtml = '<a href="#">Trail <svg width="10" height="10" aria-hidden="true"></svg></a>'
        const trailCandidates = candidatesOf(trailHtml)('link', 'Trail')
        expect(trailCandidates).toBeDefined()
        expect(trailCandidates?.some((c) => c.startsWith('role/'))).toBe(false)
        expect(trailCandidates?.some((c) => c.startsWith('aria/'))).toBe(false)
        expect(trailCandidates).toContain('a=Trail')

        // Non-breaking space (&nbsp;) skips role/, aria/, and text locators
        const nbspHtml = '<a href="#">&nbsp;Nbsp lead</a>'
        const nbspCandidates = candidatesOf(nbspHtml)('link', 'Nbsp lead')
        expect(nbspCandidates).toBeDefined()
        expect(nbspCandidates?.some((c) => c.startsWith('role/'))).toBe(false)
        expect(nbspCandidates?.some((c) => c.startsWith('aria/'))).toBe(false)
        expect(nbspCandidates?.some((c) => c.startsWith('a='))).toBe(false)

        // Empty aria-label falls back to content with leading whitespace and still skips role/ and aria/
        const emptyLabelHtml = '<a href="/logout" class="button" aria-label=""><i class="icon-signout" style="display:inline-block;width:10px;height:10px;background:#000"></i> Logout</a>'
        const emptyLabelCandidates = candidatesOf(emptyLabelHtml)('link', 'Logout')
        expect(emptyLabelCandidates?.some((c) => c.startsWith('role/'))).toBe(false)
        expect(emptyLabelCandidates?.some((c) => c.startsWith('aria/'))).toBe(false)

        // Unresolved aria-labelledby falls back to content and still skips role/ and aria/
        const unresolvedByHtml = '<a href="/logout" class="button" aria-labelledby="nonexistent"><i class="icon-signout" style="display:inline-block;width:10px;height:10px;background:#000"></i> Logout</a>'
        const unresolvedCandidates = candidatesOf(unresolvedByHtml)('link', 'Logout')
        expect(unresolvedCandidates?.some((c) => c.startsWith('role/'))).toBe(false)
        expect(unresolvedCandidates?.some((c) => c.startsWith('aria/'))).toBe(false)

        // Non-empty aria-label without leading whitespace allows role/ and aria/
        const validLabelHtml = '<a href="/logout" class="button" aria-label="Logout"><i class="icon-signout" style="display:inline-block;width:10px;height:10px;background:#000"></i> Logout</a>'
        const validLabelCandidates = candidatesOf(validLabelHtml)('link', 'Logout')
        expect(validLabelCandidates).toContain('role/link[name="Logout"]')
        expect(validLabelCandidates).toContain('aria/Logout')

        // Resolved aria-labelledby without leading whitespace allows role/ and aria/
        const resolvedByHtml = '<span id="logout-lbl">Logout</span><a href="/logout" class="button" aria-labelledby="logout-lbl"><i class="icon-signout" style="display:inline-block;width:10px;height:10px;background:#000"></i></a>'
        const resolvedCandidates = candidatesOf(resolvedByHtml)('link', 'Logout')
        expect(resolvedCandidates).toContain('role/link[name="Logout"]')
        expect(resolvedCandidates).toContain('aria/Logout')

        // Wrapped label where browser trims edge space allows role/
        const wrappedLabelHtml = '<label>Remember me <input type="checkbox"></label>'
        const wrappedCandidates = candidatesOf(wrappedLabelHtml)('checkbox', 'Remember me')
        expect(wrappedCandidates).toContain('role/checkbox[name="Remember me"]')

        const btnHtml = '<button><svg width="10" height="10"></svg> Submit</button>'
        const btnCandidates = candidatesOf(btnHtml)('button', 'Submit')
        expect(btnCandidates).toBeDefined()
        expect(btnCandidates?.some((c) => c.startsWith('role/'))).toBe(false)
        expect(btnCandidates?.some((c) => c.startsWith('aria/'))).toBe(false)
        expect(btnCandidates).toContain('button=Submit')
    })

    it('anchors positional css-path to body when the relative path is ambiguous', () => {
        document.body.innerHTML = `
            <section aria-label="Billing"><button aria-label=""></button><div><button><svg width="10" height="10"></svg></button></div></section>
            <div><h2>Shipping</h2><button><svg width="10" height="10"></svg></button></div>
        `
        const collect = new Function(`return (${collectInPage.toString()})`)() as typeof collectInPage
        const { refs, tree } = collect({ roles: roleTable(), knownRoles: knownRoles(), counter: 0, all: false, boxes: false, assignRefs: true })
        attachSelectors(tree, refs)

        // Find the nameless button in Shipping div
        const shippingButtonEl = document.querySelector('div:not(section div) > button')
        expect(shippingButtonEl).not.toBeNull()

        const shippingRef = refs.find((ref) => {
            const candidate = ref.candidates.find((c) => c.kind === 'css-path')
            return candidate && candidate.selector.startsWith('body > ')
        })
        expect(shippingRef).toBeDefined()

        const cssCandidate = shippingRef!.candidates.find((c) => c.kind === 'css-path')!
        expect(cssCandidate.selector).toBe('body > div > button')
        const matched = document.querySelectorAll(cssCandidate.selector)
        expect(matched).toHaveLength(1)
        expect(matched[0]).toBe(shippingButtonEl)

        // Multiple sibling divs under body get nth-of-type
        document.body.innerHTML = `
            <div><button><svg width="10" height="10"></svg></button></div>
            <div><button><svg width="10" height="10"></svg></button></div>
        `
        const { refs: multiRefs } = collect({ roles: roleTable(), knownRoles: knownRoles(), counter: 0, all: false, boxes: false, assignRefs: true })
        const multiCss = multiRefs.map((r) => r.candidates.find((c) => c.kind === 'css-path')?.selector)
        expect(multiCss).toEqual(['div:nth-of-type(1) > button', 'div:nth-of-type(2) > button'])
    })

    it('drops css-path candidate when neither relative path nor anchored path is unique', () => {
        document.body.innerHTML = ''
        const host1 = document.createElement('div')
        const host2 = document.createElement('div')
        document.body.appendChild(host1)
        document.body.appendChild(host2)
        host1.attachShadow({ mode: 'open' }).innerHTML = '<button></button>'
        host2.attachShadow({ mode: 'open' }).innerHTML = '<button></button>'
        const collect = new Function(`return (${collectInPage.toString()})`)() as typeof collectInPage
        const { refs } = collect({ roles: roleTable(), knownRoles: knownRoles(), counter: 0, all: false, boxes: false, assignRefs: true })
        expect(refs).toHaveLength(2)
        for (const ref of refs) {
            expect(ref.candidates.some((c) => c.kind === 'css-path')).toBe(false)
        }
    })
})
