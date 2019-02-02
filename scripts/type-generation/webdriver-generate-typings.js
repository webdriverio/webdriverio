#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const PROTOCOLS = {
    webdriver: require('../../packages/webdriver/protocol/webdriver.json'),
    appium: require('../../packages/webdriver/protocol/appium.json'),
    jsonwp: require('../../packages/webdriver/protocol/jsonwp.json'),
    mjsonwp: require('../../packages/webdriver/protocol/mjsonwp.json'),
    saucelabs: require('../../packages/webdriver/protocol/saucelabs.json')
}

const TEMPLATE_PATH = path.join(__dirname, '../templates', 'webdriver.tpl.d.ts')

const lines = []
for (const [protocolName, definition] of Object.entries(PROTOCOLS)) {
    lines.push(`    // ${protocolName} types`)
    lines.push('    interface Client<T> {')

    for (const [, methods] of Object.entries(definition)) {
        for (const [, description] of Object.entries(methods)) {
            const { command, parameters = [], variables = [], returns } = description
            const vars = variables
                .filter((v) => v.name != 'sessionId' && v.name != 'elementId')
                .map((v) => `${v.name}: string`)
            const params = parameters.map((p) => `${p.name}${p.required === false ? '?' : ''}: ${p.type.toLowerCase()}`)
            const varsAndParams = vars.concat(params)
            let returnValue = returns ? returns.type.toLowerCase() : 'undefined'
            returnValue = returnValue === '*' ? 'any' : returnValue
            lines.push(`        ${command}(${varsAndParams.join(', ')}): ${returnValue};`)
        }
    }

    lines.push('    }\n')
}

const template = fs.readFileSync(TEMPLATE_PATH, 'utf8')
const outputFile = path.join(__dirname, '..', '..', 'packages/webdriver', 'webdriver.d.ts')
const generatedTypings = template.replace('// ... insert here ...', lines.join('\n'))
fs.writeFileSync(outputFile, generatedTypings, { encoding: 'utf-8' })

// eslint-disable-next-line no-console
console.log(`Generated typings file at ${outputFile}`)
