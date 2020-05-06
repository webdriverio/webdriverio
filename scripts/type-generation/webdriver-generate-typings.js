#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { PROTOCOLS, EDIT_WARNING } = require('../constants')

const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'webdriver.tpl.d.ts')
const returnTypeMap = require('./webdriver-return-types.json')

const INDENTATION = ' '.repeat(8)
const jsDocTemplate = `
${INDENTATION}/**
${INDENTATION} * [{PROTOCOL}]
${INDENTATION} * {DESCRIPTION}
${INDENTATION} * {REF}
${INDENTATION} */`

const lines = []
for (const [protocolName, definition] of Object.entries(PROTOCOLS)) {
    lines.push(`    // ${protocolName} types`)
    lines.push('    interface Client extends BaseClient {')

    for (const [, methods] of Object.entries(definition)) {
        for (const [, description] of Object.entries(methods)) {
            const { command, parameters = [], variables = [], returns, ref } = description
            if (!ref) {
                throw new Error(`missing ref for command ${command} in ${protocolName}`)
            }
            const vars = variables
                // sessionId is handled by WebdriverIO for all protocol requests
                .filter((v) => v.name != 'sessionId')
                // url params are always type of string
                .map((v) => `${v.name}: string`)
            const params = parameters.map((p) => `${p.name}${p.required === false ? '?' : ''}: ${p.type.toLowerCase()}`)
            const varsAndParams = vars.concat(params)
            let returnValue = returns ? returns.type.toLowerCase() : 'void'
            returnValue = returnValue === '*' ? 'any' : returnValue
            returnValue = returnValue === 'object' ? (returnTypeMap[command] || 'ProtocolCommandResponse') : returnValue
            const jsDoc = jsDocTemplate
                .replace('{PROTOCOL}', protocolName)
                .replace('{DESCRIPTION}', description.description || '')
                .replace('{REF}', ref)
            lines.push(jsDoc)
            lines.push(`${INDENTATION}${command}(${varsAndParams.join(', ')}): ${returnValue};`)
        }
    }

    lines.push('    }\n')
}

const template = fs.readFileSync(TEMPLATE_PATH, 'utf8')
const outputFile = path.join(__dirname, '..', '..', 'packages', 'webdriver', 'webdriver.d.ts')
const generatedTypings = EDIT_WARNING + template.replace('// ... insert here ...', lines.join('\n'))
fs.writeFileSync(outputFile, generatedTypings, { encoding: 'utf-8' })

// eslint-disable-next-line no-console
console.log(`Generated typings file at ${outputFile}`)
