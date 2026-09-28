/**
 * Rewrites option blocks (type / default / required / contexts) into the <Option> MDX component.
 * Headings stay in Markdown so they remain in the table of contents.
 */
const META_LINE = /^(?:Type: |Default: |Options: |Mandatory: |- +\*\*(?:Type|Mandatory|Default|Supported Application Contexts):\*\*|\*\*Default:\*\*)/

function attr (value: string) {
    if (value.includes('\n') || value.includes('"') || value.includes('`') || value.includes('{') || value.includes('}') || value.includes('<')) {
        const escaped = value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
        return '{`' + escaped + '`}'
    }
    return `"${value}"`
}

function cleanValue (raw: string) {
    const value = raw.trim().replace(/<br\s*\/>$/, '').trim()
    const nested = value.match(/^``([\s\S]*)``$/)
    if (nested) {
        return nested[1].trim()
    }
    const noted = value.match(/^`([^`]*)`(.*)$/)
    if (noted) {
        return `${noted[1]}${noted[2]}`.trim()
    }
    return value.replace(/^[`*]+|[`*]+$/g, '').replace(/`/g, '').trim()
}

function parseCluster (lines: string[]) {
    const meta: { type?: string, default?: string, values?: string, required?: string, contexts?: string } = {}
    for (const line of lines) {
        if (!line.trim()) {
            continue
        }
        const boldDefault = line.match(/^\*\*Default:\*\*\s*(.*)$/)
        if (boldDefault) {
            meta.default = boldDefault[1].replace(/`/g, '').trim()
            continue
        }
        const bullet = line.match(/^- +\*\*(Type|Mandatory|Default|Supported Application Contexts):\*\*\s*(.*)$/)
        const label = bullet?.[1]
        const raw = bullet ? bullet[2] : line.replace(/^(Type|Default|Options):\s*/, '')
        const key = label || line.slice(0, line.indexOf(':'))
        const value = cleanValue(raw)
        if (key === 'Type') {
            meta.type = value.replace(/,\s*$/, '')
        } else if (key === 'Default') {
            meta.default = value
        } else if (key === 'Options') {
            meta.values = value
        } else if (key === 'Mandatory') {
            meta.required = value
        } else if (key === 'Supported Application Contexts') {
            meta.contexts = value
        }
    }
    return meta.type ? meta : null
}

function transformSection (body: string) {
    const lines = body.split('\n')
    let fence = false
    const metaLines: string[] = []
    const restLines: string[] = []
    for (const line of lines) {
        if (line.trimStart().startsWith('```')) {
            fence = !fence
            restLines.push(line)
            continue
        }
        if (!fence && META_LINE.test(line)) {
            metaLines.push(line)
            continue
        }
        restLines.push(line)
    }
    if (metaLines.length === 0) {
        return body
    }
    const meta = parseCluster(metaLines)
    if (!meta?.type) {
        return body
    }
    const rest = restLines.join('\n').replace(/\n+---\s*$/g, '').trim()
    const attrs = [`type=${attr(meta.type)}`]
    if (meta.default !== undefined) {
        attrs.push(`default=${attr(meta.default)}`)
    }
    if (meta.values) {
        attrs.push(`values=${attr(meta.values)}`)
    }
    if (meta.required) {
        attrs.push(`required=${attr(meta.required)}`)
    }
    if (meta.contexts) {
        attrs.push(`contexts=${attr(meta.contexts)}`)
    }
    const block = rest
        ? `<Option ${attrs.join(' ')}>\n\n${rest}\n\n</Option>`
        : `<Option ${attrs.join(' ')} />`
    return `\n${block}\n`
}

function bubbleNestedMeta (parts: string[]) {
    const parsed = parts.map((part) => {
        const match = part.match(/^(#{2,6}) /)
        return { part, level: match ? match[1].length : 0 }
    })
    for (let i = 0; i < parsed.length; i++) {
        if (parsed[i].level < 4) {
            continue
        }
        const newline = parsed[i].part.indexOf('\n')
        const body = newline === -1 ? '' : parsed[i].part.slice(newline + 1)
        if (!body.split('\n').some((line) => META_LINE.test(line))) {
            continue
        }
        let ancestor = -1
        for (let j = i - 1; j >= 0; j--) {
            if (parsed[j].level > 0 && parsed[j].level < parsed[i].level) {
                ancestor = j
                break
            }
        }
        if (ancestor === -1) {
            continue
        }
        const ancestorBody = parsed[ancestor].part.slice(parsed[ancestor].part.indexOf('\n') + 1)
        if (ancestorBody.split('\n').some((line) => META_LINE.test(line))) {
            continue
        }
        const lines = body.split('\n')
        const kept: string[] = []
        const moved: string[] = []
        let fence = false
        let moving = false
        for (const line of lines) {
            if (line.trimStart().startsWith('```')) {
                fence = !fence
            }
            if (!fence && !moving && META_LINE.test(line)) {
                moving = true
            }
            if (moving && (META_LINE.test(line) || line.trim() === '')) {
                moved.push(line)
            } else {
                moving = false
                kept.push(line)
            }
        }
        if (!moved.some((line) => META_LINE.test(line))) {
            continue
        }
        const heading = parsed[i].part.slice(0, newline)
        parsed[i].part = `${heading}\n${kept.join('\n').replace(/\n{3,}/g, '\n\n')}`
        parsed[ancestor].part = `${parsed[ancestor].part.replace(/\s*$/, '')}\n\n${moved.join('\n').trim()}\n`
    }
    return parsed.map((entry) => entry.part)
}

export function formatOptionDocs (markdown: string) {
    const parts = bubbleNestedMeta(markdown.split(/^(?=#{2,6} )/m))
    return parts.map((part) => {
        if (!/^#{2,6} /.test(part)) {
            return part
        }
        const newline = part.indexOf('\n')
        if (newline === -1) {
            return part
        }
        let heading = part.slice(0, newline)
        let sectionBody = part.slice(newline + 1)
        const optionHeading = heading.match(/^(#{2,6} `[^`]+`) \((.+)\)\s*$/)
        if (optionHeading) {
            heading = optionHeading[1]
            const inner = optionHeading[2].replace(/\\</g, '<')
            const comma = inner.lastIndexOf(',')
            let type = inner
            let required: string | undefined
            if (comma !== -1) {
                type = inner.slice(0, comma).trim()
                const flag = inner.slice(comma + 1).trim()
                required = /^optional$/i.test(flag) ? 'No' : flag.replace(/^required\b/i, 'Yes')
            }
            const injected = [`- **Type:** \`${type}\``]
            if (required) {
                injected.push(`- **Mandatory:** ${required}`)
            }
            sectionBody = `${injected.join('\n')}\n${sectionBody}`
        }
        const body = transformSection(sectionBody).replace(/\n+---\s*$/g, '\n')
        return `${heading}\n${body}`
    }).join('').replace(/\n{3,}/g, '\n\n')
}
