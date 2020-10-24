#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { PROTOCOLS } = require('../constants')

const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'webdriver.tpl.d.ts')
const returnTypeMap = require('./webdriver-return-types.json')
const paramTypeMap = require('./webdriver-param-types.json')

const INDENTATION = ' '.repeat(4)
const jsDocTemplate = `
${INDENTATION}/**
${INDENTATION} * [{PROTOCOL}]
${INDENTATION} * {DESCRIPTION}
${INDENTATION} * {REF}
${INDENTATION} */`

const lines = []
for (const [protocolName, definition] of Object.entries(PROTOCOLS)) {
    lines.push(`// ${protocolName} types`)
    lines.push('interface Client extends BaseClient {')

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
            const params = parameters.map((p, idx) => {
                const paramType = paramTypeMap[command] && paramTypeMap[command][idx] && paramTypeMap[command][idx].name === p.name
                    ? paramTypeMap[command][idx].type
                    : p.type.toLowerCase()
                return `${p.name}${p.required === false ? '?' : ''}: ${paramType}`
            })
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

    lines.push('}')
}

const template = fs.readFileSync(TEMPLATE_PATH, 'utf8')
const outputFile = path.join(__dirname, '..', '..', 'packages', 'webdriver', 'build', 'types.d.ts')
const generatedTypings = template.replace('// ... insert here ...', lines.join('\n'))

const origTypings = fs.readFileSync(outputFile, 'utf8')
fs.writeFileSync(outputFile, origTypings.replace('export {};', generatedTypings), { encoding: 'utf-8' })

// eslint-disable-next-line no-console
console.log(`Generated typings file at ${outputFile}`)
