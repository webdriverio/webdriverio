#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { PROTOCOLS } = require('../constants')

const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'devtools.tpl.d.ts')
const paramTypeMap = require('./webdriver-param-types.json')

const lines = []
const protocolName = 'devtools'
const definition = PROTOCOLS.webdriver

lines.push(`    // ${protocolName} types`)
lines.push('    interface Client {')

for (const [, methods] of Object.entries(definition)) {
    for (const [, description] of Object.entries(methods)) {
        const { command, parameters = [], variables = [], returns } = description
        const vars = variables
            .filter((v) => v.name != 'sessionId' && v.name != 'elementId')
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
        lines.push(`        ${command}(${varsAndParams.join(', ')}): ${returnValue};`)
    }
}

lines.push('    }\n')

const template = fs.readFileSync(TEMPLATE_PATH, 'utf8')
const outputFile = path.join(__dirname, '..', '..', 'packages', 'devtools', 'devtools.d.ts')
const generatedTypings = template.replace('// ... insert here ...', lines.join('\n'))
fs.writeFileSync(outputFile, generatedTypings, { encoding: 'utf-8' })

// eslint-disable-next-line no-console
console.log(`Generated typings file at ${outputFile}`)
