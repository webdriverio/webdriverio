import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { resolveOptionalDependency } from '@wdio/utils/node'

import { functionExpression } from './collect.js'
import { PROVIDER_NAME } from './refs.js'

export interface SelectorProvider {
    /**
     * selector prefix (`name:arg`) and the `kind` of the candidates it produces
     */
    name: string
    /**
     * attributes whose value identifies an element, e.g. `['data-e2e']`
     */
    attributes?: string[]
    /**
     * returns selectors for an element, best first. Runs in the page: it must be
     * self-contained, with no imports and no closures over outer variables.
     */
    candidates?: (el: Element) => string | string[] | undefined | Promise<string | string[] | undefined>
    /**
     * resolves a `name:arg` selector to elements, for selectors that are not CSS
     */
    locator?: (arg: string) => Element | Element[] | null | Promise<Element | Element[] | null>
}

export interface SerializedSelectorProvider {
    name: string
    attributes?: string[]
    candidates?: string
    locator?: string
}

export type SelectorProviderEntry = string | [string, Record<string, unknown>] | SelectorProvider

const PROVIDER_SUBPATH = 'selector-provider'

function isFileSpec (spec: string) {
    return spec.startsWith('.') || spec.startsWith('file:') || path.isAbsolute(spec)
}

/**
 * Where a service's provider lives. Services are discovered by convention only:
 * the package itself is a service, not a provider.
 */
function serviceSpecifiers (name: string): string[] {
    if (name.startsWith('@') || name.endsWith('-service')) {
        return [`${name}/${PROVIDER_SUBPATH}`]
    }
    const lower = name.toLowerCase()
    return [`@wdio/${lower}-service/${PROVIDER_SUBPATH}`, `wdio-${lower}-service/${PROVIDER_SUBPATH}`]
}

function entrySpecifiers (name: string): string[] {
    return [...new Set([...serviceSpecifiers(name), `${name}/${PROVIDER_SUBPATH}`, name])]
}

async function importFile (fileUrl: string, options: Record<string, unknown>, spec: string): Promise<SelectorProvider[]> {
    const mod = await import(fileUrl) as { default?: unknown }
    if (mod.default === undefined) {
        throw new Error(`Selector provider "${spec}" has no default export`)
    }
    const exported = typeof mod.default === 'function'
        ? (mod.default as (options: Record<string, unknown>) => SelectorProvider | SelectorProvider[])(options)
        : mod.default as SelectorProvider | SelectorProvider[]
    return Array.isArray(exported) ? exported : [exported]
}

async function resolveFirst (specifiers: string[], cwd: string): Promise<string | null> {
    for (const specifier of specifiers) {
        const resolved = await resolveOptionalDependency(specifier, { cwd })
        if (resolved) {
            return resolved
        }
    }
    return null
}

async function loadEntry (spec: string, { cwd, options = {} }: { cwd: string, options?: Record<string, unknown> }): Promise<SelectorProvider[]> {
    if (isFileSpec(spec)) {
        const fileUrl = spec.startsWith('file:') ? spec : pathToFileURL(path.resolve(cwd, spec)).href
        return importFile(fileUrl, options, spec)
    }
    const specifiers = entrySpecifiers(spec)
    const resolved = await resolveFirst(specifiers, cwd)
    if (!resolved) {
        throw new Error(`Selector provider "${spec}" not found, tried: ${specifiers.join(', ')}`)
    }
    return importFile(pathToFileURL(resolved).href, options, spec)
}

async function loadService (name: string, cwd: string): Promise<SelectorProvider[]> {
    const resolved = await resolveFirst(serviceSpecifiers(name), cwd)
    return resolved ? importFile(pathToFileURL(resolved).href, {}, name) : []
}

/**
 * Loads the selector providers of the `snapshots` config and of the services.
 * An explicit entry must resolve. A service without a `selector-provider`
 * export is skipped.
 */
export async function loadSelectorProviders (entries: SelectorProviderEntry[], { cwd, services = [] }: { cwd: string, services?: string[] }): Promise<SelectorProvider[]> {
    const loaded: SelectorProvider[] = []
    for (const entry of entries) {
        if (typeof entry === 'string') {
            loaded.push(...await loadEntry(entry, { cwd }))
        } else if (Array.isArray(entry)) {
            loaded.push(...await loadEntry(entry[0], { cwd, options: entry[1] }))
        } else {
            loaded.push(entry)
        }
    }
    for (const service of services) {
        loaded.push(...await loadService(service, cwd))
    }
    for (const provider of loaded) {
        if (typeof provider.name !== 'string' || !PROVIDER_NAME.test(provider.name)) {
            throw new Error(`Invalid selector provider name "${String(provider.name)}": use lowercase letters, digits, "_" and "-", starting with a letter`)
        }
    }
    return loaded
}

/**
 * The page-side source of a function, checked here so that an unsupported
 * shape fails at load time rather than in the page.
 */
function checkSerializable (name: string, prop: 'candidates' | 'locator', src: string): string {
    try {
        new Function('return (' + functionExpression(src) + ')')
    } catch {
        throw new Error(`Selector provider "${name}": ${prop} cannot be serialized (generators, getters and computed names are unsupported)`)
    }
    return src
}

export function serializeSelectorProviders (list: SelectorProvider[]): SerializedSelectorProvider[] {
    return list.map((provider) => ({
        name: provider.name,
        ...provider.attributes && { attributes: provider.attributes },
        ...provider.candidates && { candidates: checkSerializable(provider.name, 'candidates', provider.candidates.toString()) },
        ...provider.locator && { locator: checkSerializable(provider.name, 'locator', provider.locator.toString()) }
    }))
}
