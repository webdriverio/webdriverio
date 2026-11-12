export interface XmlNode {
    name: string
    attrs: Record<string, string>
    children: XmlNode[]
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

function decode (value: string) {
    return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (all, entity: string) => {
        if (entity[0] === '#') {
            const code = entity[1] === 'x' || entity[1] === 'X' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10)
            // out-of-range code points would make String.fromCodePoint throw and
            // take the whole snapshot down with it; keep the raw text instead
            return Number.isSafeInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : all
        }
        return ENTITIES[entity] ?? all
    })
}

/**
 * A small XML reader for Appium page source. It keeps element names,
 * attributes and element children.
 */
export function parseXml (source: string): XmlNode {
    const xml = source
        .replace(/<\?[\s\S]*?\?>/g, '')
        // CDATA can contain markup-looking text (`<![CDATA[<node/>]]>`), which
        // the tag scanner would otherwise read as real elements
        .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
        .replace(/<!--[\s\S]*?-->/g, '')
    const root: XmlNode = { name: '#root', attrs: {}, children: [] }
    const stack: XmlNode[] = [root]
    // quoted strings are matched as alternatives so a `>` inside an attribute
    // value (e.g. `text="Next >"`) does not end the tag early
    const tag = /<(\/)?([^\s!/>]+)((?:"[^"]*"|'[^']*'|[^>])*)>/g
    // whitespace around the = of an attribute is valid XML
    const attr = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g
    let match: RegExpExecArray | null
    while ((match = tag.exec(xml))) {
        const closing = Boolean(match[1])
        const name = match[2]
        let attrSource = match[3]
        // a trailing slash marks a self-closing tag; strip it before reading attributes
        const selfClosing = closing || attrSource.endsWith('/')
        if (selfClosing && !closing) {
            attrSource = attrSource.slice(0, -1)
        }
        if (closing) {
            if (stack.length > 1 && stack[stack.length - 1].name === name) {
                stack.pop()
            }
            continue
        }
        const attrs: Record<string, string> = {}
        attr.lastIndex = 0
        let found: RegExpExecArray | null
        while ((found = attr.exec(attrSource))) {
            attrs[found[1]] = decode(found[2] ?? found[3] ?? '')
        }
        const node: XmlNode = { name, attrs, children: [] }
        stack[stack.length - 1].children.push(node)
        if (!selfClosing) {
            stack.push(node)
        }
    }
    return root.children.length === 1 ? root.children[0] : root
}
