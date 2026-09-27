import type { HistoryEntry } from '../types.js'
import { SessionError } from '../errors.js'

export interface ExportOptions {
    title: string
    framework?: 'mocha' | 'jasmine'
    pageObjects?: boolean
    /**
     * when set, `browser.url` calls under this origin become path-only
     */
    baseUrl?: string
}

export interface GeneratedFile {
    path: string
    contents: string
}

const SELECTOR = /\$\((['"])((?:\\.|(?!\1).)*)\1\)/g

export function pageClassName (pathname: string) {
    const segment = pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop() || ''
    const base = segment.replace(/\.[a-z0-9]+$/i, '')
    const name = base.split(/[^a-zA-Z0-9]+/).filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join('')
    return name || 'Home'
}

/**
 * A getter name for a selector: the accessible name when the selector is
 * `aria/…`, otherwise the id, test id or text.
 */
export function getterName (selector: string) {
    let raw = selector
    if (raw.startsWith('aria/')) {
        raw = raw.slice('aria/'.length)
    } else if (raw.startsWith('#') || raw.startsWith('.')) {
        raw = raw.slice(1)
    } else {
        const testid = raw.match(/data-testid=(['"])(.*?)\1/)
        const text = raw.match(/^[a-z][a-z0-9]*=(.+)$/i)
        raw = testid?.[2] || text?.[1] || raw
    }
    const words = raw.replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean)
    const camel = words.map((word, i) => i === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1).toLowerCase()).join('')
    if (!camel) {
        return 'element'
    }
    return /^\d/.test(camel) ? `el${camel}` : camel
}

export function relativizeUrl (code: string, baseUrl?: string) {
    if (!baseUrl) {
        return code
    }
    const base = baseUrl.replace(/\/$/, '')
    return code.replaceAll(`${base}/`, '/').replaceAll(`'${base}'`, "'/'").replaceAll(`"${base}"`, '"/"')
}

function indent (code: string, spaces: number) {
    const pad = ' '.repeat(spaces)
    return code.split('\n').map((line) => line.trim() === '' ? '' : pad + line).join('\n')
}

interface SelectorUse {
    selector: string
    page: string
    getter: string
}

function unescapeSelector (raw: string) {
    return raw.replace(/\\(['"\\])/g, '$1')
}

export function generateSpec (entries: HistoryEntry[], opts: ExportOptions): GeneratedFile[] {
    const steps = entries.filter((entry) => entry.code.trim())
    for (const entry of steps) {
        if (/\bref\s*\(/.test(entry.code)) {
            throw new SessionError('EXEC_ERROR', `Step ${entry.n} still contains ref().`, {
                hint: 'Refs are rewritten when the step runs. Re-run the step after a snapshot, or remove the ref() call.'
            })
        }
    }
    const base = opts.baseUrl?.replace(/\/$/, '')
    const uses = new Map<string, SelectorUse>()
    const taken = new Map<string, Set<string>>()
    const rendered = steps.map((entry) => {
        let code = entry.kind === 'marker'
            ? entry.code.split('\n').map((line) => line.startsWith('//') ? line : `// ${line}`).join('\n')
            : entry.code
        if (entry.kind === 'open') {
            code = relativizeUrl(code, base)
        }
        if (!opts.pageObjects || entry.kind === 'marker') {
            return code
        }
        const page = pageClassName(entry.path || '/')
        return code.replace(SELECTOR, (match, _q, raw) => {
            const selector = unescapeSelector(raw)
            const key = `${page}\0${selector}`
            let use = uses.get(key)
            if (!use) {
                const names = taken.get(page) || new Set<string>()
                let getter = getterName(selector)
                const baseName = getter
                let n = 2
                while (names.has(getter)) {
                    getter = `${baseName}${n++}`
                }
                names.add(getter)
                taken.set(page, names)
                use = { selector, page, getter }
                uses.set(key, use)
            }
            const instance = use.page[0].toLowerCase() + use.page.slice(1)
            return `${instance}.${use.getter}`
        })
    })

    const pages = [...new Set([...uses.values()].map((use) => use.page))]
    const imports = [
        `import { browser${opts.pageObjects ? '' : ', $'}, expect } from '@wdio/globals'`,
        ...pages.map((page) => `import ${page}Page from './pageobjects/${page}.page.ts'`)
    ]
    const instances = pages.map((page) => `const ${page[0].toLowerCase()}${page.slice(1)} = new ${page}Page()`)
    const body = [
        ...instances,
        ...rendered
    ].filter(Boolean)
    const title = opts.title.replace(/'/g, "\\'")
    const spec = [
        ...imports,
        '',
        `describe('${title}', () => {`,
        `    it('${title}', async () => {`,
        indent(body.join('\n\n'), 8),
        '    })',
        '})',
        ''
    ].join('\n')

    const files: GeneratedFile[] = [{ path: 'spec.ts', contents: spec }]
    for (const page of pages) {
        const getters = [...uses.values()].filter((use) => use.page === page)
        const contents = [
            "import { $ } from '@wdio/globals'",
            '',
            `export default class ${page}Page {`,
            ...getters.map((use) => `    get ${use.getter} () { return $(${JSON.stringify(use.selector)}) }`),
            '}',
            ''
        ].join('\n')
        files.push({ path: `pageobjects/${page}.page.ts`, contents })
    }
    return files
}
