import url from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'

import logger from '@wdio/logger'
import { parse, print, visit, types } from 'recast'
import typescriptParser from 'recast/parsers/typescript.js'
import type { Plugin } from 'vite'

import type { MockHandler } from '../mock.js'

const log = logger('@wdio/browser-runner:mockHoisting')

const b = types.builders
const MOCK_PREFIX = '/@mock'
export function mockHoisting(mockHandler: MockHandler): Plugin[] {
    let spec: string | null = null

    return [{
        name: 'wdio:mockHoisting:pre',
        enforce: 'pre',
        resolveId: mockHandler.resolveId.bind(mockHandler),
        load: async function (id) {
            if (id.startsWith(MOCK_PREFIX)) {
                try {
                    const orig = await fs.readFile(id.slice(MOCK_PREFIX.length))
                    return orig.toString()
                } catch (err: unknown) {
                    log.error(`Failed to read file (${id}) for mocking: ${(err as Error).message}`)
                    return ''
                }
            }

            const mockedMod = (
                // mocked file
                mockHandler.mocks.get(id) ||
                // mocked dependency
                mockHandler.mocks.get(path.basename(id, path.extname(id)))
            )
            if (mockedMod) {
                const newCode = mockedMod.namedExports.map((ne) => {
                    if (ne === 'default') {
                        return /*js*/`export default window.__wdioMockFactories__['${mockedMod.path}'].default;`
                    }
                    return /*js*/`export const ${ne} = window.__wdioMockFactories__['${mockedMod.path}']['${ne}'];`
                })

                if (!mockedMod.namedExports.includes('default')) {
                    newCode.push(/*js*/`export default window.__wdioMockFactories__['${mockedMod.path}'];`)
                }

                log.debug(`Resolve mock for module "${mockedMod.path}"`)
                return newCode.join('\n')
            }
        }
    }, {
        name: 'wdio:mockHoisting',
        enforce: 'post',
        transform(code, id) {
            /**
             * only transform when spec file is transformed
             */
            if (id !== spec) {
                return { code }
            }

            const ast = parse(code, { parser: typescriptParser }) as types.namedTypes.File
            let mockFunctionName: string
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
                    /**
                     * get name of mock function variable
                     */
                    if (source === '@wdio/browser-runner') {
                        const mockSpecifier = (dec.specifiers as types.namedTypes.ImportSpecifier[])
                            .filter((s) => s.type === types.namedTypes.ImportSpecifier.toString())
                            .find((s) => s.imported.name === 'mock')
                        if (mockSpecifier && mockSpecifier.local) {
                            mockFunctionName = mockSpecifier.local.name
                        }
                        mockCalls.push(dec)
                        path.prune()
                        return this.traverse(path)
                    }

                    const newNode = b.variableDeclaration('const', [
                        b.variableDeclarator(
                            b.objectPattern(dec.specifiers!.map((s) => {
                                if (s.type === types.namedTypes.ImportDefaultSpecifier.toString()) {
                                    return b.property('init', b.identifier('default'), b.identifier(s.local!.name))
                                }
                                return b.property('init', b.identifier(s.local!.name), b.identifier(s.local!.name))
                            })),
                            b.awaitExpression(b.importExpression(b.literal(source)))
                        )
                    ])
                    path.replace(newNode)
                    this.traverse(path)
                },
                visitExpressionStatement: function (path) {
                    const exp = path.value as types.namedTypes.ExpressionStatement
                    if (exp.expression.type !== types.namedTypes.CallExpression.toString()) {
                        return this.traverse(path)
                    }

                    const callExp = exp.expression as types.namedTypes.CallExpression
                    if (!mockFunctionName || (callExp.callee as types.namedTypes.Identifier).name !== mockFunctionName) {
                        return this.traverse(path)
                    }

                    /**
                     * if only one mock argument is set, we take the fixture from the automock directory
                     */
                    const mockCall = exp.expression as types.namedTypes.CallExpression
                    if (mockCall.arguments.length === 1) {
                        mockHandler.manualMocks.push((mockCall.arguments[0] as types.namedTypes.StringLiteral).value)
                    } else {
                        mockCalls.push(exp)
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
            return { code: print(ast).code }
        },
        configureServer(server) {
            return () => {
                server.middlewares.use('/', async (req, res, next) => {
                    if (!req.url) {
                        return next()
                    }

                    const urlParsed = url.parse(req.url)
                    const urlParamString = new URLSearchParams(urlParsed.query || '')
                    spec = urlParamString.get('spec')

                    if (spec) {
                        mockHandler.resetMocks()
                    }

                    return next()
                })
            }
        }
    }]
}
