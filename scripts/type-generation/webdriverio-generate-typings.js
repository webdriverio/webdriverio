#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const dox = require('dox')
const { buildCommand, getJsDoc } = require('./generate-typings-utils')
const specifics = require('./specific-types.json')

const elementDir = path.resolve(__dirname + '../../../packages/webdriverio/src/commands/element')
const elementCommands = fs.readdirSync(elementDir)

const browserDir = path.resolve(__dirname + '../../../packages/webdriverio/src/commands/browser')
const browserCommands = fs.readdirSync(browserDir)

let allTypeLines = []

const EXCLUDED_COMMANDS = ['execute', 'executeAsync', 'waitUntil', 'call']
const INDENTATION = ' '.repeat(8)

const gatherCommands = (commandPath, commandFile, promisify = false) => {
    const commandName = commandFile.substr(0, commandFile.indexOf('.js'))

    if (specifics[commandName]) {
        const specificCommand = specifics[commandName]
        specificCommand.forEach((cmd) => {
            const params = []
            cmd.parameters.forEach((p) => {
                params.push(`${p.name}: ${p.type}`)
            })
            const returns = promisify ? `Promise<${cmd.return}>` : cmd.return

            const paramIndentation = INDENTATION + ' '.repeat(4)
            const paramStr = params.length === 0 ? '' : params
                .map((p, idx) => '\n' + paramIndentation + p + (idx + 1 < params.length ? ',' : ''))
                .join('\n') + '\n' + INDENTATION
            allTypeLines.push('', INDENTATION + commandName + `(${paramStr}): ${returns};`)
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

const generateTypes = (packageName, promisify) => {
    allTypeLines = []
    let bCommands = []
    browserCommands.forEach((commandFile) => {
        const commandPath = path.resolve(`${browserDir}/${commandFile}`)
        bCommands = gatherCommands(commandPath, commandFile, promisify)
    })
    const allBrowserCommands = bCommands.join('\n')

    allTypeLines = []

    let eCommands = []
    elementCommands.forEach((commandFile) => {
        const commandPath = path.resolve(`${elementDir}/${commandFile}`)
        eCommands = gatherCommands(commandPath, commandFile, promisify)
    })

    const allElementCommands = eCommands.join('\n')

    const templatePath = path.resolve(__dirname + '../../templates/webdriverio.tpl.d.ts')
    const templateContents = fs.readFileSync(templatePath, 'utf8')

    let typingsContents = templateContents.replace('// ... element commands ...', () => allElementCommands)
    typingsContents = typingsContents.replace('// ... browser commands ...', () => allBrowserCommands)

    const outputFileWebdriverio = path.join(__dirname, '..', '..', `packages/${packageName}`, 'webdriverio-core.d.ts')
    fs.writeFileSync(outputFileWebdriverio, typingsContents, { encoding: 'utf-8' })

    // eslint-disable-next-line no-console
    console.log(`Generated typings file at ${outputFileWebdriverio}`)
}

generateTypes('webdriverio', true)
generateTypes('wdio-sync', false)
