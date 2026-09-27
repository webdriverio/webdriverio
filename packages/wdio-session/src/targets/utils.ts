import fs from 'node:fs'
import path from 'node:path'

import { usage } from '../errors.js'

export type OpenArgs = Record<string, unknown> & {
    target: string
    url?: string
}

export function isPlainObject (value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function deepMerge<T extends Record<string, unknown>> (base: T, extra: Record<string, unknown>): T {
    const out: Record<string, unknown> = { ...base }
    for (const [key, value] of Object.entries(extra)) {
        out[key] = isPlainObject(value) && isPlainObject(out[key])
            ? deepMerge(out[key] as Record<string, unknown>, value)
            : value
    }
    return out as T
}

/**
 * `--capabilities` accepts inline JSON or a path to a JSON file
 */
export function parseCapabilitiesFlag (value: unknown, cwd: string): Record<string, unknown> {
    if (!value) {
        return {}
    }
    const str = String(value).trim()
    let json = str
    if (!str.startsWith('{')) {
        const file = path.resolve(cwd, str)
        if (!fs.existsSync(file)) {
            throw usage(`--capabilities must be JSON or a path to a JSON file, "${str}" is neither.`)
        }
        json = fs.readFileSync(file, 'utf-8')
    }
    try {
        const parsed = JSON.parse(json)
        if (!isPlainObject(parsed)) {
            throw new Error('not an object')
        }
        return parsed
    } catch (err) {
        throw usage(`Invalid --capabilities JSON: ${(err as Error).message}`)
    }
}

export function parseViewport (value: unknown) {
    if (!value) {
        return undefined
    }
    const match = /^(\d+)x(\d+)$/.exec(String(value))
    if (!match) {
        throw usage(`Invalid viewport "${value}", expected <width>x<height>, e.g. 1280x720.`)
    }
    return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) }
}

export function toArray (value: unknown): string[] {
    if (value === undefined || value === null || value === '') {
        return []
    }
    return (Array.isArray(value) ? value : [value]).map(String)
}

export function hasDisplay (env = process.env) {
    return Boolean(env.DISPLAY || env.WAYLAND_DISPLAY)
}

export function parseRemoteUrl (value: string) {
    let url: URL
    try {
        url = new URL(value)
    } catch {
        throw usage(`Invalid URL "${value}".`)
    }
    return {
        protocol: url.protocol.replace(':', ''),
        hostname: url.hostname,
        port: url.port ? parseInt(url.port, 10) : (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname || '/'
    }
}
