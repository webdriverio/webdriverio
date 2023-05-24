import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'

import camelcase from 'camelcase'
import typescriptParser from 'recast/parsers/typescript.js'
import { transform } from 'cddl2ts'
import { parse, print, types } from 'recast'
import { parse as parseCDDL, type PropertyReference, type Property, type Group } from 'cddl'
import downloadSpec from './downloadSpec.js'

const b = types.builders
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

await downloadSpec()

const cddlTypes = ['local', 'remote']
const [astLocal, astRemote] = await Promise.all(cddlTypes.map(async (type) => {
    const ast = parseCDDL(path.join(__dirname, 'cddl', `${type}.cddl`))

    /**
     * CDDL ast transformation
     * Unfortunately the CDDL can not be always correctly transformed into TypeScript
     * Therefor we need to make some adjustments here
     */
    if (type === 'remote') {
        /**
         * remove CommandData and Extensible from Command group
         */
        (ast[0] as Group).Properties = [(ast[0] as Group).Properties[0]]
        /**
         * have groups with method property extend from Command group
         */
        const commandGroups = ast.filter((a: Group) => a.Properties && a.Properties[0] && (a.Properties[0] as Property).Name === 'method') as Group[]
        for (const g of commandGroups) {
            g.Properties.push({
                HasCut: false,
                Occurrence: { n: 1, m: 1 },
                Name: '',
                Type: [{ Type: 'group', Value: 'Command', Unwrapped: false }],
                Comments: []
            })
        }
    }

    const cddl = transform(ast)
    await fs.writeFile(
        path.resolve(__dirname, '..', '..', 'packages', 'webdriver', 'src', 'bidi', `${type}Types.ts`),
        cddl.replace(/"/g, "'").replace('export interface Event extends EventData, Extensible {}', '')
    )
    return ast
}))

const code = `
import type * as local from './localTypes.js'
import type * as remote from './remoteTypes.js'
import { BidiCore } from './core.js'
`
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

    const responseType = astLocal.find((a) => camelcase(a.Name) === `${camelcase(assignment.Name)}Result`)
    const commandName = b.identifier(camelcase(assignment.Name))
    const methodId = (((assignment.Properties[0] as Property).Type as PropertyReference[])[0]).Value as string
    const paramType = `remote.${camelcase((((assignment.Properties[1] as Property).Type as PropertyReference[])[0]).Value as string, { pascalCase: true })}`
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
    const method = b.classMethod('method', commandName, [param], b.blockStatement([sendCommandCall, returnStatement]))
    method.async = true
    method.returnType = b.tsTypeAnnotation(b.tsTypeReference(
        b.identifier('Promise'),
        b.tsTypeParameterInstantiation([b.tsTypeReference(b.identifier(resultType))])
    ))
    methods.push(method)
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

await fs.writeFile(
    path.resolve(__dirname, '..', '..', 'packages', 'webdriver', 'src', 'bidi', 'handler.ts'),
    print(bidiCode, {
        tabWidth: 4,
        quote: 'single'
    }).code.replace(/;/g, '')
)
