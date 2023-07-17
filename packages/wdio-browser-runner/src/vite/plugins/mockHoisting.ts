import os from 'node:os'
import url from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'

import logger from '@wdio/logger'
import { parse, print, visit, types } from 'recast'
import typescriptParser from 'recast/parsers/typescript.js'
import type { Plugin } from 'vite'

import type { MockHandler } from '../mock.js'

const log = logger('@wdio/browser-runner:mockHoisting')
const INTERNALS_TO_IGNORE = [
    '@vite/client', 'vite/dist/client', '/webdriverio/build/', '/@wdio/', '/webdriverio/node_modules/',
    'virtual:wdio', '?html-proxy', '/__fixtures__/', '/__mocks__/', '/.vite/deps/@testing-library_vue.js'
]

const b = types.builders
const MOCK_PREFIX = '/@mock'
export function mockHoisting(mockHandler: MockHandler, rootDir: string): Plugin[] {
    let spec: string | null = null
    let isTestDependency = false
    const sessionMocks = new Set<string>()
    const importMap = new Map<string, string>()

    return [{
        name: 'wdio:mockHoisting:pre',
        enforce: 'pre',
        resolveId: mockHandler.resolveId.bind(mockHandler),
        load: async function (id) {
            if (id.startsWith(MOCK_PREFIX)) {
                try {
                    const orig = await fs.readFile(id.slice(MOCK_PREFIX.length + (os.platform() === 'win32' ? 1 : 0)))
                    return orig.toString()
                } catch (err: unknown) {
                    log.error(`Failed to read file (${id}) for mocking: ${(err as Error).message}`)
                    return ''
                }
            }

            const mocks = [...mockHandler.mocks.values()]
            const preBundledDepName = path.basename(id).split('?')[0]
            const mockedMod = (
                // mocked file
                mockHandler.mocks.get(os.platform() === 'win32' ? `/${id}` : id) ||
                // mocked dependency
                mockHandler.mocks.get(path.basename(id, path.extname(id))) ||
                // pre-bundled deps e.g. /node_modules/.vite/deps/algoliasearch_lite.js?v=e31c24e
                mocks.find((mock) => `${mock.path.replace('/', '_')}.js` === preBundledDepName) ||
                // relative file imports ignoring file extension, e.g. `mock('../../constants.ts', () => { ... })`
                mocks.find((mock) => {
                    const mockFileExtLength = path.extname(mock.path).length
                    const toCompare = mockFileExtLength > 0 ? mock.path.slice(0, -mockFileExtLength) : mock.path
                    // compare without file extension as we don't know if users use them or not
                    return toCompare === id.slice(0, -path.extname(id).length)
                })
            )
            if (mockedMod) {
                const newCode = mockedMod.namedExports.map((ne) => {
                    if (ne === 'default') {
                        return /*js*/`export default window.__wdioMockCache__.get('${mockedMod.path}').default;`
                    }
                    return /*js*/`export const ${ne} = window.__wdioMockCache__.get('${mockedMod.path}')['${ne}'];`
                })

                if (!mockedMod.namedExports.includes('default')) {
                    newCode.push(/*js*/`export default window.__wdioMockCache__.get('${mockedMod.path}');`)
                }

                log.debug(`Resolve mock for module "${mockedMod.path}"`)
                return newCode.join('\n')
            }
        }
    }, {
        name: 'wdio:mockHoisting',
        enforce: 'post',
        transform(code, id) {
            const isSpecFile = id === spec
            if (isSpecFile) {
                isTestDependency = true
            }

            /**
             * only transform files that are loaded as part of the test and are not
             * Vite or WebdriverIO internals
             */
            if (!isTestDependency || INTERNALS_TO_IGNORE.find((f) => id.includes(f))) {
                return { code }
            }

            let ast: types.namedTypes.File
            try {
                ast = parse(code, {
                    parser: typescriptParser,
                    sourceFileName: id,
                    sourceRoot: path.dirname(id)
                })
            } catch (err) {
                return { code }
            }

            log.trace(`Transform file for mocking: ${id}`)

            let importIndex = 0
            let mockFunctionName: string
            let unmockFunctionName: string
            const mockCalls: (types.namedTypes.ExpressionStatement | types.namedTypes.ImportDeclaration)[] = []

            visit(ast, {
                /**
                 * find function name for mock and unmock calls
                 */
                visitImportDeclaration: function (path) {
                    const dec = path.value as types.namedTypes.ImportDeclaration
                    const source = dec.source.value!

                    if (!dec.specifiers || dec.specifiers.length === 0 || source !== '@wdio/browser-runner') {
                        return this.traverse(path)
                    }

                    /**
                     * get name of mock function variable
                     */
                    const mockSpecifier = (dec.specifiers as types.namedTypes.ImportSpecifier[])
                        .filter((s) => s.type === types.namedTypes.ImportSpecifier.toString())
                        .find((s) => s.imported.name === 'mock')
                    if (mockSpecifier && mockSpecifier.local) {
                        mockFunctionName = mockSpecifier.local.name as string
                    }

                    const unmockSpecifier = (dec.specifiers as types.namedTypes.ImportSpecifier[])
                        .filter((s) => s.type === types.namedTypes.ImportSpecifier.toString())
                        .find((s) => s.imported.name === 'unmock')
                    if (unmockSpecifier && unmockSpecifier.local) {
                        unmockFunctionName = unmockSpecifier.local.name as string
                    }
                    mockCalls.push(dec)
                    path.prune()
                    return this.traverse(path)
                },
                /**
                 * detect which modules are supposed to be mocked
                 */
                ...(isSpecFile ? {
                    visitExpressionStatement: function (path) {
                        const exp = path.value as types.namedTypes.ExpressionStatement
                        if (exp.expression.type !== types.namedTypes.CallExpression.toString()) {
                            return this.traverse(path)
                        }

                        const callExp = exp.expression as types.namedTypes.CallExpression
                        const isUnmockCall = unmockFunctionName && (callExp.callee as types.namedTypes.Identifier).name === unmockFunctionName
                        const isMockCall = mockFunctionName && (callExp.callee as types.namedTypes.Identifier).name === mockFunctionName

                        if (!isMockCall && !isUnmockCall) {
                            return this.traverse(path)
                        }

                        /**
                         * hoist unmock calls
                         */
                        if (isUnmockCall && callExp.arguments[0] && typeof (callExp.arguments[0] as types.namedTypes.Literal).value === 'string') {
                            mockHandler.unmock((callExp.arguments[0] as types.namedTypes.Literal).value as string)
                        } else if (isMockCall) {
                            /**
                             * if only one mock argument is set, we take the fixture from the automock directory
                             */
                            const mockCall = exp.expression as types.namedTypes.CallExpression
                            if (mockCall.arguments.length === 1) {
                                /**
                                 * enable manual mock
                                 */
                                mockHandler.manualMocks.push((mockCall.arguments[0] as types.namedTypes.StringLiteral).value)
                            } else {
                                if ((exp.expression as types.namedTypes.CallExpression).arguments.length) {
                                    sessionMocks.add(((exp.expression as types.namedTypes.CallExpression).arguments[0] as types.namedTypes.Literal).value as string)
                                }

                                /**
                                 * hoist mock calls
                                 */
                                mockCalls.push(exp)
                            }
                        }

                        path.prune()
                        this.traverse(path)
                    }
                } : {})
            })
            visit(ast, {
                visitImportDeclaration: function (nodePath) {
                    const dec = nodePath.value as types.namedTypes.ImportDeclaration
                    const source = dec.source.value as string

                    if (!dec.specifiers || dec.specifiers.length === 0) {
                        return this.traverse(nodePath)
                    }

                    const newImportIdentifier = `__wdio_import${importIndex++}`

                    /**
                     * assign imports outside of spec files into custom import identifier, e.g.
                     *
                     *   from:
                     *      import { foo } from 'bar'
                     *
                     *   to:
                     *      import * as __wdio_import0 from 'bar'
                     */
                    const isMockedModule = (
                        // matches if a dependency is mocked
                        sessionMocks.has(source) ||
                        // matches if a file is mocked
                        (
                            source.startsWith('.') &&
                            [...sessionMocks.values()].find((m) => path.resolve(path.dirname(id), source) === path.resolve(rootDir, m))
                        )
                    )
                    if (!isSpecFile || isMockedModule) {
                        importMap.set(source, newImportIdentifier)
                        const newNode = b.importDeclaration(
                            [b.importNamespaceSpecifier(b.identifier(newImportIdentifier))],
                            b.literal(source)
                        )
                        nodePath.insertBefore(newNode)
                    }

                    const isNamespaceImport = dec.specifiers.length === 1 && dec.specifiers[0].type === types.namedTypes.ImportNamespaceSpecifier.toString()
                    const mockImport = isSpecFile && !isMockedModule
                        /**
                         * within spec files we transform import declarations into import expresssions, e.g.
                         *     from: import { foo } from 'bar'
                         *     to:   const { foo } = await wdioImport('bar', await import('bar'))
                         *
                         * in order to hoist `mock(...)` calls and have them run first
                         */
                        ? b.variableDeclaration('const', [
                            b.variableDeclarator(
                                isNamespaceImport
                                    /**
                                     * we deal with a ImportNamespaceSpecifier, e.g.:
                                     * import * as foo from 'bar'
                                     */
                                    ? dec.specifiers[0].local as types.namedTypes.Identifier
                                    /**
                                     * we deal with default or named import, e.g.
                                     * import foo from 'bar'
                                     * or
                                     * import { foo } from 'bar'
                                     */
                                    : b.objectPattern(dec.specifiers.map((s: types.namedTypes.ImportSpecifier) => {
                                        if (s.type === types.namedTypes.ImportDefaultSpecifier.toString()) {
                                            return b.property('init', b.identifier('default'), b.identifier(s.local!.name as string))
                                        }
                                        return b.property('init', b.identifier(s.imported.name as string), b.identifier(s.local!.name as string))
                                    })),
                                b.callExpression(
                                    /**
                                     * wrap imports into a custom function that allows us to replace the actual
                                     * module with the mocked module
                                     */
                                    b.identifier('wdioImport'),
                                    [
                                        b.literal(source),
                                        b.awaitExpression(b.importExpression(b.literal(source)))
                                    ]
                                )
                            )
                        ])
                        /**
                         * outside of spec files we transform import declarations so that the imported module gets
                         * wrapped within `wdioImport`, e.g.:
                         *
                         *   from:
                         *      import { foo } from 'bar'
                         *
                         *   to:
                         *      import { foo as __wdio_import0 } from 'bar'
                         *      const { foo } = await wdioImport('bar', __wdio_import0)
                         */
                        : b.variableDeclaration('const', [
                            b.variableDeclarator(
                                dec.specifiers.length === 1 && dec.specifiers[0].type === types.namedTypes.ImportNamespaceSpecifier.toString()
                                    ? b.identifier(dec.specifiers[0].local!.name as string)
                                    : b.objectPattern(dec.specifiers.map((s: types.namedTypes.ImportSpecifier) => {
                                        if (s.type === types.namedTypes.ImportDefaultSpecifier.toString()) {
                                            return b.property('init', b.identifier('default'), b.identifier(s.local!.name as string))
                                        }
                                        return b.property('init', b.identifier(s.imported.name as string), b.identifier(s.local!.name as string))
                                    })),
                                b.callExpression(
                                    b.identifier('wdioImport'),
                                    [
                                        b.literal(source),
                                        b.identifier(newImportIdentifier)
                                    ]
                                )
                            )
                        ])
                    nodePath.replace(mockImport)
                    this.traverse(nodePath)
                }
            })

            ast.program.body.unshift(...mockCalls.map((mc) => {
                const exp = mc as types.namedTypes.ExpressionStatement
                if (exp.expression && exp.expression.type === types.namedTypes.CallExpression.toString()) {
                    const importExpression = exp.expression as types.namedTypes.CallExpression
                    const mockedModule = (importExpression.arguments[0] as types.namedTypes.Literal).value as string
                    if (importMap.has(mockedModule)) {
                        importExpression.arguments.push(b.identifier(importMap.get(mockedModule)!))
                    }
                    return b.expressionStatement(b.awaitExpression(importExpression))
                }

                return mc
            }))

            try {
                const newCode = print(ast, {
                    sourceMapName: id
                })
                return newCode
            } catch (err) {
                return { code }
            }
        },
        configureServer(server) {
            return () => {
                server.middlewares.use('/', async (req, res, next) => {
                    if (!req.originalUrl) {
                        return next()
                    }

                    const urlParsed = url.parse(req.originalUrl)
                    const urlParamString = new URLSearchParams(urlParsed.query || '')
                    const specParam = urlParamString.get('spec')

                    if (specParam) {
                        mockHandler.resetMocks()
                        isTestDependency = false
                        spec = os.platform() === 'win32' ? specParam.slice(1) : specParam
                    }

                    return next()
                })
            }
        }
    }]
}
