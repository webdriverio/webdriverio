import path from 'node:path'
import url from 'node:url'
import { EventEmitter } from 'node:events'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { ELEMENT_KEY } from 'webdriver'

const TESTS_DIR = path.dirname(url.fileURLToPath(import.meta.url))
const FILE = path.join(TESTS_DIR, '__chainCompletions__.ts')
const CURSOR = '/*cursor*/'

/**
 * The completion entries an editor shows at the cursor, as the TypeScript
 * language service returns them for the built types of this package.
 */
function completionsAt (source: string) {
    const text = source.replace(CURSOR, '')
    const read = (file: string) => file === FILE ? text : ts.sys.readFile(file)
    const service = ts.createLanguageService({
        getScriptFileNames: () => [FILE],
        getScriptVersion: () => '1',
        getScriptSnapshot: (file) => {
            const content = read(file)
            return content === undefined ? undefined : ts.ScriptSnapshot.fromString(content)
        },
        getCurrentDirectory: () => TESTS_DIR,
        getCompilationSettings: () => ({
            module: ts.ModuleKind.NodeNext,
            moduleResolution: ts.ModuleResolutionKind.NodeNext,
            target: ts.ScriptTarget.ES2022,
            types: ['node'],
            skipLibCheck: true,
            noEmit: true
        }),
        getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
        fileExists: (file) => file === FILE || ts.sys.fileExists(file),
        readFile: read,
        readDirectory: ts.sys.readDirectory,
        directoryExists: ts.sys.directoryExists,
        getDirectories: ts.sys.getDirectories
    })
    const completions = service.getCompletionsAtPosition(
        FILE,
        source.indexOf(CURSOR),
        { includeCompletionsWithInsertText: true }
    )
    return completions?.entries ?? []
}

/**
 * The entries that rewrite the line to `(await chain).member` when picked.
 */
const awaitEntries = (source: string) => completionsAt(source)
    .filter((entry) => entry.insertText?.startsWith('(await '))
    .map((entry) => entry.name)

const SOURCE = `
    import type { ChainablePromiseElement, ChainablePromiseArray } from 'webdriverio'
    declare const chain: ChainablePromiseElement
    declare const list: ChainablePromiseArray
    export async function run () {
        await EXPRESSION.${CURSOR}
    }
`

/**
 * These members reach the chain through `Omit<WebdriverIO.Element, ...>`, see
 * `ChainablePromiseElement` in `src/types.ts`.
 */
const TAKEN_FROM_ELEMENT = [
    ...Object.getOwnPropertyNames(EventEmitter.prototype),
    ELEMENT_KEY
]

describe('completions of a chained element', () => {
    it('offers the commands and properties of the chain', () => {
        const names = completionsAt(SOURCE.replace('EXPRESSION', 'chain')).map((entry) => entry.name)
        expect(names).toEqual(expect.arrayContaining([
            '$', '$$', 'click', 'getText', 'waitForDisplayed', 'tap',
            'elementId', 'selector', 'getElementText', 'sessionId', 'capabilities', 'isMobile'
        ]))
    })

    /**
     * An editor replaces `await chain.` with `(await chain).click` when such an
     * entry is picked. If this fails for a new element command, declare the
     * command in `ChainableElementCommands`.
     */
    it.each([
        ['$()', 'chain'],
        ['$().$()', "chain.$('a')"],
        ['$$()[0]', 'list[0]']
    ])('does not offer a member of %s behind `(await chain)`', (_, expression) => {
        const names = awaitEntries(SOURCE.replace('EXPRESSION', expression))
        expect(names.filter((name) => !TAKEN_FROM_ELEMENT.includes(name))).toEqual([])
    })

    it('still offers what only the awaited list has', () => {
        expect(awaitEntries(SOURCE.replace('EXPRESSION', 'list'))).toEqual(expect.arrayContaining(['push', 'pop']))
    })
})
