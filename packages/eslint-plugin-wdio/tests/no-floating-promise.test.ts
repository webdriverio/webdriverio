import path from 'node:path'
import Module from 'node:module'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RuleTester, type Rule } from 'eslint'
import tseslint from 'typescript-eslint'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtureDir = path.join(__dirname, 'fixtures', 'typed')
const srcDir = path.resolve(__dirname, '..', 'src')

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
            projectService: true,
            tsconfigRootDir: fixtureDir,
        },
    },
})
const filename = path.join(fixtureDir, 'file.ts')
const declarations = 'declare const browser: { url(u: string): Promise<void> };'

const runRuleTester = (rule: Rule.RuleModule) => {
    ruleTester.run('no-floating-promise', rule, {
        valid: [
            { code: `${declarations} async function t () { await browser.url('/') }`, filename },
            { code: `${declarations} function t () { void browser.url('/') }`, filename },
        ],
        invalid: [
            {
                code: `${declarations} async function t () { browser.url('/') }`,
                filename,
                errors: [{
                    messageId: 'floatingVoid',
                    suggestions: [
                        { messageId: 'floatingFixVoid', output: `${declarations} async function t () { void browser.url('/') }` },
                        { messageId: 'floatingFixAwait', output: `${declarations} async function t () { await browser.url('/') }` },
                    ],
                }],
            },
        ],
    })
}

type ResolveFilename = (request: string, parent?: { filename?: string }, ...rest: unknown[]) => string

/**
 * Make `request` unresolvable from this package's source only, like a strict
 * layout (pnpm `hoist: false`, Yarn PnP) that exposes declared dependencies
 * and peers. Packages in node_modules still resolve it.
 */
const hideFromSource = (request: string) => {
    const loader = Module as unknown as { _resolveFilename: ResolveFilename }
    const resolveFilename = loader._resolveFilename
    vi.spyOn(loader, '_resolveFilename').mockImplementation(function (this: unknown, req, parent, ...rest) {
        if (req === request && parent?.filename?.startsWith(srcDir)) {
            throw Object.assign(new Error(`Cannot find module '${req}'`), { code: 'MODULE_NOT_FOUND' })
        }
        return resolveFilename.call(this, req, parent, ...rest)
    })
    vi.resetModules()
}

describe('no-floating-promise', () => {
    afterEach(() => {
        vi.restoreAllMocks()
        vi.resetModules()
    })

    it('should report a promise that is not awaited', async () => {
        const { default: rule } = await import('../src/rules/no-floating-promise.js')
        runRuleTester(rule)
    })

    it('should not need @typescript-eslint/eslint-plugin to resolve from this package', async () => {
        // Not a declared dependency or peer. `typescript-eslint` depends on it.
        hideFromSource('@typescript-eslint/eslint-plugin')
        const { default: rule } = await import('../src/rules/no-floating-promise.js')
        runRuleTester(rule)
    })

    it('should throw a clear error when typescript-eslint is missing', async () => {
        hideFromSource('typescript-eslint')
        const { default: rule } = await import('../src/rules/no-floating-promise.js')
        expect(() => rule.create({} as Rule.RuleContext)).toThrow('wdio/no-floating-promise needs the "typescript-eslint" package')
    })
})
