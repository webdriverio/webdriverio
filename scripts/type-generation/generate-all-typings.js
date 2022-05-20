#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')
const camelCase = require('camelcase')

const { PROTOCOLS } = require('../constants')

const TYPINGS_PATH = path.join(__dirname, '..', '..', 'packages', 'wdio-protocols', 'src', 'commands')
const returnTypeMap = require('./webdriver-return-types.json')
const paramTypeMap = require('./webdriver-param-types.json')

const INDENTATION = ' '.repeat(4)
const EXAMPLE_INDENTATION = `${INDENTATION} * `
const jsDocTemplate = `
${INDENTATION}/**
${INDENTATION} * {PROTOCOL} Protocol Command
${INDENTATION} *
${INDENTATION} * {DESCRIPTION}
${INDENTATION} * @ref {REF}
${INDENTATION} *{EXAMPLE}
${INDENTATION} */`

/**
 * create directory if not existing
 */
if (!fs.existsSync(TYPINGS_PATH)) {
    fs.mkdirSync(TYPINGS_PATH)
}

for (const [protocolName, definition] of Object.entries(PROTOCOLS)) {
    const interfaceName = protocolName.slice(0, 1).toUpperCase() + protocolName.slice(1)
    const customTypes = new Set()
    const lines = ['']

    lines.push(`// ${protocolName} types`)
    lines.push(`export default interface ${interfaceName}Commands {`)

    for (const [, methods] of Object.entries(definition)) {
        for (const [, description] of Object.entries(methods)) {
            const { command, parameters = [], variables = [], returns, ref, examples } = description
            if (!ref) {
                throw new Error(`missing ref for command ${command} in ${protocolName}`)
            }
            const vars = variables
                // sessionId is handled by WebdriverIO for all protocol requests
                .filter((v) => v.name != 'sessionId')
                // url params are always type of string
                .map((v) => `${v.name}: string`)
            const params = parameters.map((p, idx) => {
                const paramType = paramTypeMap[command] && paramTypeMap[command][idx] && paramTypeMap[command][idx].name === p.name
                    ? paramTypeMap[command][idx].type
                    : p.type.toLowerCase()
                return `${camelCase(p.name)}${p.required === false ? '?' : ''}: ${paramType}`
            })
            const varsAndParams = vars.concat(params)
            let returnValue = returns ? returns.type.toLowerCase() : 'void'
            returnValue = returnValue === '*' ? 'any' : returnValue
            if (returnTypeMap[command]) {
                returnValue = returnTypeMap[command]
                customTypes.add(returnTypeMap[command].replace('[]', ''))
            }
            if (returnValue === 'object') {
                returnValue = 'ProtocolCommandResponse'
                customTypes.add(returnValue)
            }

            const jsDoc = jsDocTemplate
                .replace('{PROTOCOL}', interfaceName)
                .replace('{DESCRIPTION}', description.description || 'No description available, please see reference link.')
                .replace('{EXAMPLE}', (
                    (examples || [])
                        .map((example) => (
                            `\n${EXAMPLE_INDENTATION}@example\n` +
                            `${EXAMPLE_INDENTATION}\`\`\`js\n` +
                            EXAMPLE_INDENTATION +
                                `${example.map((l, i) => (i === 0
                                    ? `${l}`
                                    : `${EXAMPLE_INDENTATION}${l.replace(/(\/\*\*|\s\*\s|\s\*\/)/, '// ')}`.trimEnd())
                                ).join('\n')}\n` +
                            `${EXAMPLE_INDENTATION}` + '```'
                        ))
                        .join(`\n${EXAMPLE_INDENTATION}`.trim())
                )
                )
                .replace('{REF}', ref)
            lines.push(jsDoc)
            lines.push(`${INDENTATION}${command}(${varsAndParams.join(', ')}): ${returnValue};`)
        }
    }

    /**
     * import missing protocol types
     */
    if (customTypes.size) {
        lines.unshift(`import { ${[...customTypes].join(', ')} } from '../types'`)
    }

    lines.push('}')

    fs.writeFileSync(path.join(TYPINGS_PATH, `${protocolName}.ts`), lines.join('\n'), 'utf8')
    console.log(`Generated typings file for ${protocolName}`)
}
