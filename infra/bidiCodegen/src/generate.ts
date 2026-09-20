import url from 'node:url'
import path from 'node:path'
import util from 'node:util'

import camelcase from 'camelcase'
import typescriptParser from 'recast/parsers/typescript.js'
import { transform } from 'cddl2ts'
import { parse, print, types } from 'recast'
import { parse as parseCDDL, type PropertyReference, type Property } from 'cddl'
import { getRootDir } from '@wdio/repo-utils'

import downloadSpec from './downloadSpec.js'
import type { CddlType } from './utils.js'
import { findGroupByName, writeFile } from './utils.js'
import { BASE_PROTOCOL_SPEC, CDDL_PARSE_ERROR_MESSAGE } from './constants.js'

const b = types.builders
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export interface GenerateBidiOptions {
    auth?: string
    cddlDir?: string
    rootDir?: string
    skipDownload?: boolean
}

/**
 * Download the latest WebDriver Bidi CDDL spec and generate TypeScript types
 * plus protocol command metadata.
 *
 * @returns `true` when files were written, `false` when generation was skipped
 */
export async function generateBidiTypes (options: GenerateBidiOptions = {}) {
    const auth = options.auth ?? process.env.GITHUB_AUTH
    const rootDir = options.rootDir ?? getRootDir()
    const cddlDir = options.cddlDir ?? path.resolve(__dirname, '..', 'cddl')

    // Start of `webdriverBidi.ts`
    const jsonSpec = Object.assign(BASE_PROTOCOL_SPEC)

    if (!auth) {
        console.log('Couldn\'t find "GITHUB_AUTH" environment variable, skipping')
        return false
    }

    if (!options.skipDownload) {
        const hasNewSpec = await downloadSpec({ targetDir: cddlDir, auth })
        if (!hasNewSpec) {
            console.log('No new spec, exiting!')
            return false
        }
    }

    const cddlTypes: CddlType[] = ['local', 'remote']
    const [astLocal, astRemote] = await Promise.all(cddlTypes.map(async (type) => {
        const cddlPath = path.join(cddlDir, `${type}.cddl`)

        let ast
        try {
            ast = parseCDDL(cddlPath)
        } catch (err) {
            console.error(util.format(CDDL_PARSE_ERROR_MESSAGE, `Failed to parse ${type}.cddl: ${(err as Error).stack}`))
            return null
        }

        const cddl = transform(ast, { useUnknown: true })

        await writeFile(
            path.resolve(rootDir, 'packages', 'webdriver', 'src', 'bidi', `${type}Types.ts`),
            cddl
        )
        return ast
    }))

    if (!astLocal || !astRemote) {
        return false
    }

    const code = `
import type * as local from './localTypes.js'
import type * as remote from './remoteTypes.js'
import { BidiCore } from './core.js'`

    const bidiCode = parse(code, { parser: typescriptParser }) as types.namedTypes.File
    const methods: types.namedTypes.ClassMethod[] = []
    for (const assignment of astRemote) {
        /**
         * only create methods for groups that have a method property and therefor are commands that
         * receive a certain result
         */
        if (assignment.Type !== 'group' || assignment.Properties.length === 0 || (assignment.Properties[0] as Property).Name !== 'method') {
            continue
        }

        const commandName = camelcase(assignment.Name)
        const responseType = astLocal.find((a) => camelcase(a.Name) === `${camelcase(assignment.Name)}Result`)
        const methodId = (((assignment.Properties[0] as Property).Type as PropertyReference[])[0]).Value as string
        const paramName = (((assignment.Properties[1] as Property).Type as PropertyReference[])[0]).Value as string
        const paramType = `remote.${camelcase(paramName, { pascalCase: true })}`
        const resultType = responseType ? `local.${camelcase(responseType.Name, { pascalCase: true })}` : 'local.EmptyResult'

        /**
         * define class methods, e.g.
         * ```
         * async sessionNew (params: remote.SessionNewParameters): Promise<local.SessionNewResult> {
         *     const result = await this.send({ method: 'session.new', params })
         *     return result.result as local.SessionNewResult
         * }
         * ```
         */
        const paramKey = 'params'
        const methodProp = b.objectProperty(b.identifier('method'), b.stringLiteral(methodId))
        const paramsProp = b.objectProperty(b.identifier(paramKey), b.identifier(paramKey))
        paramsProp.shorthand = true
        const sendCommandCall = b.variableDeclaration('const', [
            b.variableDeclarator(
                b.identifier('result'),
                b.awaitExpression(b.callExpression(
                    b.memberExpression(b.identifier('this'), b.identifier('send')),
                    [b.objectExpression([methodProp, paramsProp])]
                ))
            )
        ])
        const returnStatement = b.returnStatement(b.tsAsExpression(
            b.memberExpression(b.identifier('result'), b.identifier('result')),
            b.tsTypeReference(b.identifier(resultType))
        ))
        const param = b.identifier(paramKey)
        param.typeAnnotation = b.tsTypeAnnotation(b.tsTypeReference(b.identifier(paramType)))
        const method = b.classMethod('method', b.identifier(commandName), [param], b.blockStatement([sendCommandCall, returnStatement]))
        method.async = true
        method.returnType = b.tsTypeAnnotation(b.tsTypeReference(
            b.identifier('Promise'),
            b.tsTypeParameterInstantiation([b.tsTypeReference(b.identifier(resultType))])
        ))
        const specUrl = `https://w3c.github.io/webdriver-bidi/#command-${methodId.replace('.', '-')}`
        const description = `WebDriver Bidi command to send command method "${methodId}" with parameters.`
        const comment = b.commentBlock([
            '*',
            ` * ${description}`,
            ` * @url ${specUrl}`,
            ` * @param ${paramKey} \`${paramType}\` {@link ${specUrl} | command parameter}`,
            ` * @returns \`Promise<${resultType}>\``,
            ' *'
        ].join('\n'), true)
        method.comments = [comment]
        methods.push(method)

        const paramAST = findGroupByName(astRemote, paramName)
        const commandParamTS = paramAST ? transform([paramAST]) : ''
        const exampleStart = commandParamTS.indexOf('{')
        const paramExample = (exampleStart === -1 || paramName.includes('EmptyParams'))
            ? ''
            : commandParamTS.slice(exampleStart)
                .replaceAll('\n', '<br />')
                .replaceAll('*', '\\*')
                .replaceAll('|', '&#124;')
                .replaceAll('{', '\\{')
                .replaceAll('}', '\\}')

        const commandReturnAST = astLocal.find((a) => a.Name === (responseType?.Name || 'EmptyResult'))
        const commandReturnTS = commandReturnAST ? transform([commandReturnAST]) : ''
        const returnExample = commandReturnTS.slice(commandReturnTS.indexOf('{'))
        const example = returnExample === '{}'
            ? undefined
            : ['', '```ts', ...returnExample.split('\n'), '```'].join('\n   ')

        jsonSpec[methodId] = {
            socket: {
                command: commandName,
                description,
                ref: specUrl,
                parameters: [{
                    name: paramKey,
                    type: `\`${paramType}\``,

                    description: paramExample
                        ? `<pre>${paramExample}</pre>`
                        : '<pre>\\{\\}</pre>',
                    required: true
                }],
                ...(example ? {
                    returns: {
                        type: 'Object',
                        name: resultType,
                        description: `Command return value with the following interface:${example}`,
                    }
                } : {})
            }
        }
    }

    /**
     * define class: `export class BidiHandler extends BidiCore {`
     */
    const bidiHandlerClass = b.classDeclaration(
        b.identifier('BidiHandler'),
        b.classBody(methods)
    )
    bidiHandlerClass.superClass = b.identifier('BidiCore')
    bidiCode.program.body.push(b.exportNamedDeclaration(bidiHandlerClass))

    await writeFile(
        path.resolve(rootDir, 'packages', 'webdriver', 'src', 'bidi', 'handler.ts'),
        print(bidiCode, {
            tabWidth: 4,
            quote: 'single'
        }).code.replace(/;/g, '')
    )
    await writeFile(
        path.resolve(rootDir, 'packages', 'wdio-protocols', 'src', 'protocols', 'webdriverBidi.ts'),
        (
            `const protocol = ${JSON.stringify(jsonSpec, null, 4)} as const\n` +
            'export default protocol'
        )
    )

    return true
}
