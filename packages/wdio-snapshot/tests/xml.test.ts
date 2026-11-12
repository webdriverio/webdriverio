import { describe, it, expect } from 'vitest'

import { parseXml } from '../src/xml.js'

describe('page source reader', () => {
    it('reads nested elements and attributes', () => {
        const xml = parseXml(`<hierarchy>
  <android.widget.FrameLayout bounds="[0,0][100,100]">
    <android.widget.Button text="Save" />
  </android.widget.FrameLayout>
</hierarchy>`)
        expect(xml.name).toBe('hierarchy')
        const frame = xml.children[0]
        expect(frame.name).toBe('android.widget.FrameLayout')
        expect(frame.attrs.bounds).toBe('[0,0][100,100]')
        expect(frame.children[0].name).toBe('android.widget.Button')
        expect(frame.children[0].attrs.text).toBe('Save')
    })

    it('reads double- and single-quoted attribute values', () => {
        const xml = parseXml(`
    <node a="one" b='two' c="it's" d='say "hi"' />
`)
        expect(xml.attrs).toEqual({ a: 'one', b: 'two', c: "it's", d: 'say "hi"' })
    })

    it('reads an attribute without a value as an empty string', () => {
        expect(parseXml('<node checked>').attrs).toEqual({ checked: '' })
    })

    it('keeps the last of duplicate attributes', () => {
        expect(parseXml('<node text="first" text="second" />').attrs.text).toBe('second')
    })

    it('reads self-closing tags with and without a space before the slash', () => {
        const tight = parseXml('<node text="a"/>')
        const spaced = parseXml('<node text="a" />')
        expect(tight.children).toEqual([])
        expect(spaced.children).toEqual([])
        expect(tight.attrs.text).toBe('a')
        expect(spaced.attrs.text).toBe('a')
    })

    it('reads a self-closing tag whose attribute value ends in a slash', () => {
        const xml = parseXml('<node url="https://example.com/" text="ok"/>')
        expect(xml.attrs.url).toBe('https://example.com/')
        expect(xml.attrs.text).toBe('ok')
        expect(xml.children).toEqual([])
    })

    it('reads an attribute value that contains >', () => {
        const xml = parseXml('<hierarchy><node text="Next >" class="android.widget.Button"/></hierarchy>')
        const button = xml.children[0]
        expect(button.attrs.text).toBe('Next >')
        expect(button.attrs.class).toBe('android.widget.Button')
        expect(button.children).toEqual([])
    })

    it('reads attributes that follow a value containing >', () => {
        const xml = parseXml('<hierarchy><node text="a > b" content-desc="desc" clickable="true" bounds="[0,0][10,10]"/></hierarchy>')
        expect(xml.children[0].attrs).toEqual({ text: 'a > b', 'content-desc': 'desc', clickable: 'true', bounds: '[0,0][10,10]' })
    })

    it('reads a quoted > in the middle of a longer page source', () => {
        const xml = parseXml(`<hierarchy>
  <node text="Total > 0" displayed="true" bounds="[0,0][10,10]" />
  <node text="plain" displayed="true" bounds="[0,10][10,20]" />
</hierarchy>`)
        expect(xml.children[0].attrs.text).toBe('Total > 0')
        expect(xml.children[1].attrs.text).toBe('plain')
    })

    it('skips comments and processing instructions', () => {
        const xml = parseXml('<?xml version="1.0" encoding="UTF-8"?><!-- a comment --><hierarchy><node text="a" /><!-- another --></hierarchy>')
        expect(xml.name).toBe('hierarchy')
        expect(xml.children).toHaveLength(1)
        expect(xml.children[0].attrs.text).toBe('a')
    })

    it('ignores a closing tag that does not match the open element', () => {
        const xml = parseXml('<hierarchy><node><other></node></hierarchy>')
        expect(xml.name).toBe('hierarchy')
        expect(xml.children[0].name).toBe('node')
    })

    it('decodes the five predefined entities in attribute values', () => {
        const xml = parseXml('<node a="&amp;" b="&lt;" c="&gt;" d="&quot;" e="&apos;" />')
        expect(xml.attrs).toEqual({ a: '&', b: '<', c: '>', d: '"', e: "'" })
    })

    it('decodes decimal and hexadecimal character references', () => {
        const xml = parseXml('<node a="&#38;" b="&#x26;" c="&#x1F600;" />')
        expect(xml.attrs.a).toBe('&')
        expect(xml.attrs.b).toBe('&')
        expect(xml.attrs.c).toBe('\u{1F600}')
    })

    it('keeps an unknown entity as it is', () => {
        const xml = parseXml('<node a="&nbsp;" b="&notanentity;" />')
        expect(xml.attrs.a).toBe('&nbsp;')
        expect(xml.attrs.b).toBe('&notanentity;')
    })

    it('keeps an out-of-range character reference as it is instead of crashing', () => {
        expect(() => parseXml('<node a="&#99999999999;" />')).not.toThrow()
        const xml = parseXml('<node a="&#99999999999;" b="&#x110000;" />')
        expect(xml.attrs.a).toBe('&#99999999999;')
        expect(xml.attrs.b).toBe('&#x110000;')
    })

    it('does not read markup inside a CDATA section as elements', () => {
        const xml = parseXml(`<root>
  <![CDATA[<node text="fake"/>]]>
  <node text="real" />
</root>`)
        expect(xml.children).toHaveLength(1)
        expect(xml.children[0].attrs.text).toBe('real')
    })

    it('reads a CDATA section that contains < without breaking the scan', () => {
        const xml = parseXml('<root><![CDATA[if (a < b) {}]]></root>')
        expect(xml.children).toEqual([])
    })

    it('reads an attribute with whitespace around the equals sign', () => {
        const xml = parseXml('<node b = "2" c="3"/>')
        expect(xml.attrs).toEqual({ b: '2', c: '3' })
    })

    it('returns the single root element, or a holder when there are several', () => {
        expect(parseXml('<a text="x" />').name).toBe('a')
        const holder = parseXml('<a /><b />')
        expect(holder.name).toBe('#root')
        expect(holder.children.map((child) => child.name)).toEqual(['a', 'b'])
    })
})
