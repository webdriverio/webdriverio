#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const dox = require('dox')

const { buildCommand, getJsDoc } = require('./generate-typings-utils')
const specifics = require('./specific-types.json')
const { EDIT_WARNING } = require('../constants')

const TYPING_SCOPES = ['element', 'browser', 'network', 'mock']
const EXCLUDED_COMMANDS = ['execute', 'executeAsync', 'call']
const INDENTATION = ' '.repeat(8)

const jsDocTemplate = `
${INDENTATION}/**
${INDENTATION} * {DESCRIPTION}
${INDENTATION} */`

const gatherCommands = (commandPath, commandFile, promisify = false) => {
    const allTypeLines = []
    const commandName = commandFile.substr(0, commandFile.indexOf('.js'))

    if (specifics[commandName]) {
        const specificCommand = specifics[commandName]
        const { properties, description } = specificCommand
        properties.forEach((cmd) => {
            const params = []
            cmd.parameters.forEach((p) => {
                params.push(`${p.name}: ${p.type}`)
            })
            const returns = promisify ? `Promise<${cmd.return}>` : cmd.return

            const paramIndentation = INDENTATION + ' '.repeat(4)
            const paramStr = params.length === 0 ? '' : params
                .map((p, idx) => '\n' + paramIndentation + p + (idx + 1 < params.length ? ',' : ''))
                .join('\n') + '\n' + INDENTATION
            allTypeLines.push(jsDocTemplate.replace('{DESCRIPTION}', description), INDENTATION + commandName + `(${paramStr}): ${returns};`)
        })
    } else if (!EXCLUDED_COMMANDS.includes(commandName)) {
        const commandContents = fs.readFileSync(commandPath).toString()
        const commandDocs = dox.parseComments(commandContents)
        const commandTags = commandDocs[0].tags
        const command = buildCommand(commandName, commandTags, 4, promisify)
        const jsdoc = getJsDoc(commandName, commandContents, 8)

        allTypeLines.push('', INDENTATION + jsdoc + command + ';')
    }

    return allTypeLines
}

const generateTypes = (packageName, promisify, fileName = 'webdriverio-core.d.ts') => {
    const templatePath = path.resolve(__dirname + '../../templates/webdriverio.tpl.d.ts')
    const templateContents = fs.readFileSync(templatePath, 'utf8')
    let typingsContents = EDIT_WARNING + templateContents

    for (const scope of TYPING_SCOPES) {
        const scopeCommands = []
        const scopePath = path.resolve(__dirname, '..', '..', 'packages', 'webdriverio', 'src', 'commands', scope)
        const scopeCommandFiles = fs.readdirSync(scopePath)
        scopeCommandFiles.forEach((commandFile) => {
            const commandPath = path.resolve(`${scopePath}/${commandFile}`)
            scopeCommands.push(...gatherCommands(commandPath, commandFile, promisify))
        })

        typingsContents = typingsContents.replace(`// ... ${scope} commands ...`, () => scopeCommands.join('\n'))
    }

    const outputFile = path.join(__dirname, '..', '..', `packages/${packageName}`, fileName)
    fs.writeFileSync(outputFile, typingsContents, { encoding: 'utf-8' })

    // eslint-disable-next-line no-console
    console.log(`Generated typings file at ${outputFile}`)
}

generateTypes('webdriverio', true)
generateTypes('wdio-sync', false)
