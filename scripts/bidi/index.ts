import url from 'node:url'
import path from 'node:path'
import util from 'node:util'
import fs from 'node:fs'

import camelcase from 'camelcase'
import typescriptParser from 'recast/parsers/typescript.js'
import { transform } from 'cddl2ts'
import { parse, print, types } from 'recast'
import type { Assignment } from 'cddl'
import { parse as parseCDDL, type PropertyReference, type Property, type Group } from 'cddl'

import downloadSpec from './downloadSpec.js'
import { writeFile } from './utils.js'
import { BASE_PROTOCOL_SPEC, CDDL_PARSE_ERROR_MESSAGE } from './constants.js'

function findGroup (ast: Assignment[], name: string): Group | undefined {
    return ast.find((a: Assignment): a is Group => a.Type === 'group' && a.Name === name)
}

const b = types.builders
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

// Start of `webdriverBidi.ts`
const jsonSpec = Object.assign(BASE_PROTOCOL_SPEC)

if (!process.env.GITHUB_AUTH) {
    console.log('Couldn\'t find "GITHUB_AUTH" environment variable, skipping')
    process.exit(0)
}

const hasNewSpec = await downloadSpec()
if (!hasNewSpec) {
    console.log('No new spec, exiting!')
    process.exit(0)
}

const cddlTypes = ['local', 'remote']
const [astLocal, astRemote] = await Promise.all(cddlTypes.map(async (type) => {
    const cddlPath = path.join(__dirname, 'cddl', `${type}.cddl`)
    const tempPath = path.join(__dirname, 'cddl', `${type}.tmp.cddl`)
    let content = fs.readFileSync(cddlPath, 'utf8')

    // Fixes error found in the local.cddl. Report those issue to https://github.com/w3c/webdriver-bidi to have them fixed.
    if (type === 'local') {
        // `InputResult` is missing in local.cddl, remove temporary fix when issue is merge: https://github.com/w3c/webdriver-bidi/pull/1102
        content += `
InputResult = (
  input.PerformActionsResult /
  input.ReleaseActionsResult /
  input.SetFilesResult
)

`
    // Fixes error found in the remote.cddl. Report those issue to https://github.com/w3c/webdriver-bidi to have them fixed.
    } else if (type === 'remote') {
        // `InputResult` should not be in remote.cddl, remove temporary fix when issue is merge: https://github.com/w3c/webdriver-bidi/pull/1102
        content = content.replace(/InputResult\s*=\s*\(\s*input\.PerformActionsResult\s*\/\s*input\.ReleaseActionsResult\s*\/\s*input\.SetFilesResult\s*\)/g, '')
            .replace(/input\.FileDialogOpened\s*=\s*\(\s*method:\s*"input\.fileDialogOpened",\s*params:\s*input\.FileDialogInfo\s*\)\s*input\.FileDialogInfo\s*=\s*\{\s*context:\s*browsingContext\.BrowsingContext,\s*\?\s*userContext:\s*browser\.UserContext,\s*\?\s*element:\s*script\.SharedReference,\s*multiple:\s*bool,\s*\}/g, '')
    }

    fs.writeFileSync(tempPath, content)

    let ast
    try {
        ast = parseCDDL(tempPath)
    } catch (err) {
        console.log(util.format(CDDL_PARSE_ERROR_MESSAGE, `Failed to parse ${type}.cddl: ${(err as Error).stack}`))
        process.exit(0)
    } finally {
        fs.unlinkSync(tempPath)
    }

    // @ts-expect-error - fixed in the library, waiting for next release
    const cddl = transform(ast, { useUnknown: true })
    await writeFile(
        path.resolve(__dirname, '..', '..', 'packages', 'webdriver', 'src', 'bidi', `${type}Types.ts`),
        cddl
    )
    return ast
}))

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

    const paramAST = findGroup(astRemote, paramName)
    const commandParamTS = paramAST ? transform([paramAST]) : ''
    const exampleStart = commandParamTS.indexOf('{')
    const paramExample = (exampleStart === -1 || paramName.includes('EmptyParams'))
        ? ''
        : commandParamTS.slice(exampleStart)
            .replaceAll('\n', '<br />')
            .replaceAll('*', '\\*')
            .replaceAll('|', '&#124;')

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
                    ? `<pre>\\${paramExample.slice(0, -1)}\\}</pre>`
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
    path.resolve(__dirname, '..', '..', 'packages', 'webdriver', 'src', 'bidi', 'handler.ts'),
    print(bidiCode, {
        tabWidth: 4,
        quote: 'single'
    }).code.replace(/;/g, '')
)
await writeFile(
    path.resolve(__dirname, '..', '..', 'packages', 'wdio-protocols', 'src', 'protocols', 'webdriverBidi.ts'),
    (
        `const protocol = ${JSON.stringify(jsonSpec, null, 4)} as const\n` +
        'export default protocol'
    )
)
