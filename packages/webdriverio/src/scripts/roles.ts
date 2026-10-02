import { elementRoles, roles } from 'aria-query'

/**
 * attribute test: exact value, `set`, `undefined` (absent) or `>1`
 */
export type AttributeTest = [name: string, test: string]

/**
 * `[tag, attribute tests, element constraints, role]`
 */
export type RoleRule = [tag: string, attributes: AttributeTest[], constraints: string[], role: string]

let cache: RoleRule[] | undefined

/**
 * Implicit ARIA roles of HTML elements from `aria-query`, most specific
 * rules first. Passed to in-page scripts (the `role/` selector fallback and
 * `@wdio/session` snapshots) so the page needs no dependency.
 */
export function roleTable (): RoleRule[] {
    if (cache) {
        return cache
    }
    const rules: RoleRule[] = []
    for (const [element, elementRoleSet] of elementRoles.entries()) {
        const role = [...elementRoleSet][0]
        if (!role) {
            continue
        }
        const attributes: AttributeTest[] = (element.attributes || []).map((a) => {
            const constraint = (a as { constraints?: string[] }).constraints?.[0]
            return [a.name, constraint ?? (a.value === undefined ? 'set' : `=${a.value}`)]
        })
        rules.push([element.name, attributes, (element as { constraints?: string[] }).constraints || [], String(role)])
    }
    cache = rules.sort((a, b) => b[1].length - a[1].length || b[2].length - a[2].length)
    return cache
}

/**
 * ARIA 1.3 renamed `img` to `image`. Browsers report `image`, `aria-query`
 * still uses `img`. The `role/` selector accepts both and sends `image`.
 */
export const ROLE_SYNONYMS: Record<string, string> = {
    img: 'image'
}

/**
 * Every role name `aria-query` knows, abstract roles excluded, plus the
 * ARIA 1.3 names in `ROLE_SYNONYMS`.
 */
export function knownRoles (): string[] {
    return [
        ...[...roles.entries()]
            .filter(([, definition]) => !definition.abstract)
            .map(([name]) => String(name)),
        ...Object.values(ROLE_SYNONYMS)
    ]
}
