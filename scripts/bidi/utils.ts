import fs from 'node:fs/promises'

import { GENERATED_FILE_COMMENT } from './constants.js'
import type { Assignment, Group, Property, PropertyReference, PropertyType } from 'cddl'

export type CddlType = 'local' | 'remote'

/**
 * write generated ts file so it
 *   - passes our eslint rules (no crlf)
 *   - and has a note at the top that the file is generated
 *
 * @param filePath path to file to write
 * @param content content of file
 */
export async function writeFile (filePath: string, content: string) {
    return fs.writeFile(
        filePath,
        GENERATED_FILE_COMMENT + '\n\n' + content.replace(/\r\n/g, '\n')
    )
}

export function findGroupByName (ast: Assignment[], name: string): Group | undefined {
    return ast.find((a: Assignment): a is Group => a.Type === 'group' && a.Name === name)
}

const isPropertyReference = (t: PropertyType): t is PropertyReference =>
    typeof t === 'object' && t !== null && 'Value' in t && typeof (t as PropertyReference).Value === 'string'

function collectTypeRefs (types: PropertyType | PropertyType[], acc: Set<string>) {
    const arr = Array.isArray(types) ? types : [types]
    for (const t of arr) {
        if (isPropertyReference(t) && (t.Type === 'group' || t.Type === 'group_array')) {
            acc.add(t.Value as string)
        }
    }
}

/**
 * The W3C WebDriver BiDi CDDL splits its specification across `local.cddl`
 * (response types) and `remote.cddl` (command types), but some shared aliases
 * (e.g. `browsingContext.Screencast = text`) are only declared in `local.cddl`
 * even though `remote.cddl` references them. Generating each file in isolation
 * leaves dangling references in `remoteTypes.ts`.
 *
 * Walk the remote AST, find references whose name is not defined in the remote
 * AST but is defined in the local AST, and copy those assignments into the
 * remote AST so the generated TS has its aliases.
 */
export function backfillCrossCddlRefs (target: Assignment[], source: Assignment[]): void {
    const refs = new Set<string>()
    for (const a of target) {
        if (a.Type === 'group') {
            for (const p of (a as Group).Properties) {
                const props = Array.isArray(p) ? p : [p]
                for (const pp of props as Property[]) {collectTypeRefs(pp.Type, refs)}
            }
        } else if (a.Type === 'array') {
            for (const v of a.Values) {
                const vs = Array.isArray(v) ? v : [v]
                for (const vv of vs as Property[]) {collectTypeRefs(vv.Type, refs)}
            }
        }
    }
    const defined = new Set(target.map((a) => a.Name))
    for (const ref of refs) {
        if (defined.has(ref)) {
            continue
        }
        const fromSource = source.find((a) => a.Name === ref)
        if (fromSource) {
            target.push(fromSource)
        }
    }
}
