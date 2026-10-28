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
            return Number.isFinite(code) ? String.fromCodePoint(code) : all
        }
        return ENTITIES[entity] ?? all
    })
}

/**
 * A small XML reader for Appium page source. It keeps element names,
 * attributes and element children.
 */
export function parseXml (source: string): XmlNode {
    const xml = source.replace(/<\?[\s\S]*?\?>/g, '').replace(/<!--[\s\S]*?-->/g, '')
    const root: XmlNode = { name: '#root', attrs: {}, children: [] }
    const stack: XmlNode[] = [root]
    const tag = /<(\/)?([^\s!/>]+)([^>]*?)(\/)?>/g
    let match: RegExpExecArray | null
    while ((match = tag.exec(xml))) {
        const closing = Boolean(match[1])
        const name = match[2]
        const selfClosing = Boolean(match[4]) || closing
        if (closing) {
            if (stack.length > 1 && stack[stack.length - 1].name === name) {
                stack.pop()
            }
            continue
        }
        const attrs: Record<string, string> = {}
        const attr = /([^\s=]+)(?:=(?:"([^"]*)"|'([^']*)'))?/g
        let found: RegExpExecArray | null
        while ((found = attr.exec(match[3]))) {
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
