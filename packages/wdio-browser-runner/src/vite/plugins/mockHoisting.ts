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
const FILES_TO_IGNORE = [
    '@vite/client', 'vite/dist/client', '/webdriverio/build/', '/@wdio/', '__vite-',
    '/webdriverio/node_modules/', '/webdriverio/packages/', 'virtual:wdio', '?html-proxy'
]

const b = types.builders
const MOCK_PREFIX = '/@mock'
export function mockHoisting(mockHandler: MockHandler): Plugin[] {
    let spec: string | null = null
    const sessionMocks = new Set<string>()

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
            if (FILES_TO_IGNORE.find((f) => id.includes(f))) {
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

            let importIndex = 0
            let mockFunctionName: string
            let unmockFunctionName: string
            const mockCalls: (types.namedTypes.ExpressionStatement | types.namedTypes.ImportDeclaration)[] = []

            /**
             * rewrite import statements into variable declarations, e.g. from
             *
             *     import React, { RC } from 'react'
             *
             * to
             *
             *     var { default: React, RC: RC } = await import("react")
             *
             * so we can hoist the mock call
             */
            visit(ast, {
                visitImportDeclaration: function (path) {
                    const dec = path.value as types.namedTypes.ImportDeclaration
                    const source = dec.source.value!

                    if (!dec.specifiers || dec.specifiers.length === 0) {
                        return this.traverse(path)
                    }

                    /**
                     * get name of mock function variable
                     */
                    if (source === '@wdio/browser-runner') {
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
                    }

                    const newImportIdentifier = `__wdio_import${importIndex++}`
                    if (id !== spec) {
                        const newNode = b.importDeclaration(
                            [b.importNamespaceSpecifier(b.identifier(newImportIdentifier))],
                            b.literal(source)
                        )
                        path.insertBefore(newNode)
                    }

                    const isNamespaceImport = dec.specifiers.length === 1 && dec.specifiers[0].type === types.namedTypes.ImportNamespaceSpecifier.toString()
                    const mockImport = id === spec
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
                    path.replace(mockImport)
                    this.traverse(path)
                },
                visitExpressionStatement: function (path) {
                    if (id !== spec) {
                        return this.traverse(path)
                    }

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
            })

            ast.program.body.unshift(...mockCalls.map((mc) => {
                const exp = mc as types.namedTypes.ExpressionStatement
                if (exp.expression && exp.expression.type === types.namedTypes.CallExpression.toString()) {
                    return b.expressionStatement(b.awaitExpression(exp.expression))
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
                        spec = os.platform() === 'win32' ? specParam.slice(1) : specParam
                    }

                    return next()
                })
            }
        }
    }]
}
