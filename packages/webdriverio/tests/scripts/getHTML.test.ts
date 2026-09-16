/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import getHTML from '../../src/scripts/getHTML.js'

describe('getHTML script', () => {
    it.each([true, false])('excludes elements without changing the original (includeSelectorTag: %s)', (includeSelectorTag) => {
        const element = document.createElement('section')
        element.innerHTML = '<span>Keep</span><style>span { color: red }</style><i class="omit">Remove</i>'
        const originalHTML = element.outerHTML

        expect(getHTML(element, includeSelectorTag, ['style', '.omit'])).toBe(includeSelectorTag
            ? '<section><span>Keep</span></section>'
            : '<span>Keep</span>')
        expect(element.outerHTML).toBe(originalHTML)
    })

    it('excludes the target only when its tag is included', () => {
        const element = document.createElement('section')
        element.innerHTML = '<span>Keep</span>'

        expect(getHTML(element, true, ['section'])).toBe('')
        expect(getHTML(element, false, ['section'])).toBe('<span>Keep</span>')
        expect(element.innerHTML).toBe('<span>Keep</span>')
    })

    it('preserves text inside noscript instead of treating it as elements', () => {
        const element = document.createElement('section')
        const noscript = document.createElement('noscript')
        noscript.append(document.createTextNode('<p>Keep</p>'))
        const paragraph = document.createElement('p')
        paragraph.textContent = 'Remove'
        element.append(noscript, paragraph)
        const originalHTML = element.outerHTML

        expect(element.querySelectorAll('p')).toHaveLength(1)
        expect(getHTML(element, true, ['p'])).toBe(`<section>${noscript.outerHTML}</section>`)
        expect(element.outerHTML).toBe(originalHTML)
    })

    it('preserves case-sensitive SVG attributes', () => {
        const namespace = 'http://www.w3.org/2000/svg'
        const element = document.createElementNS(namespace, 'svg')
        const group = document.createElementNS(namespace, 'g')
        group.setAttribute('customFlag', 'active')
        const style = document.createElementNS(namespace, 'style')
        style.textContent = 'g { fill: red }'
        element.append(group, style)
        const originalHTML = element.outerHTML

        expect(getHTML(element as unknown as HTMLElement, true, ['style']))
            .toBe('<svg><g customFlag="active"></g></svg>')
        expect(element.outerHTML).toBe(originalHTML)
    })

    it('does not invoke custom element constructors while copying the snapshot', () => {
        let constructions = 0
        customElements.define('get-html-counter', class extends HTMLElement {
            constructor() {
                super()
                constructions++
            }
        })
        const element = document.createElement('get-html-counter')
        element.innerHTML = '<span>Keep</span><style>Remove</style>'
        const initialConstructions = constructions

        expect(getHTML(element, true, ['style']))
            .toBe('<get-html-counter><span>Keep</span></get-html-counter>')
        expect(constructions).toBe(initialConstructions)
    })
})
