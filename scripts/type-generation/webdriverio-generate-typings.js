#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const dox = require('dox')
const { buildCommand } = require('./generate-typings-utils')
const specifics = require('./specific-types.json')

const elementDir = path.resolve(__dirname + '../../../packages/webdriverio/src/commands/element')
const elementCommands = fs.readdirSync(elementDir)

const browserDir = path.resolve(__dirname + '../../../packages/webdriverio/src/commands/browser')
const browserCommands = fs.readdirSync(browserDir)

let allTypeLines = []

const EXCLUDED_COMMANDS = ['execute', 'executeAsync', 'waitUntil', 'call']

const gatherCommands = (commandPath, commandFile) => {
    const commandName = commandFile.substr(0, commandFile.indexOf('.js')).replace('$', '$$$')

    if(specifics[commandName]){
        const specificCommand = specifics[commandName]
        specificCommand.forEach((cmd) => {
            const params = []
            cmd.parameters.forEach((p) => {
                params.push(`${p.name}: ${p.type}`)
            })
            const returns = cmd.return

            allTypeLines.push(`${commandName}(${params.length > 0 ? '\n            ' : ''}${params.join(',\n            ')}${params.length > 0 ? '\n        ' : ''}): ${returns}`)
        })
    } else if (!EXCLUDED_COMMANDS.includes(commandName)) {
        const commandContents = fs.readFileSync(commandPath).toString()
        const commandDocs = dox.parseComments(commandContents)
        const commandTags = commandDocs[0].tags
        const command = buildCommand(commandName, commandTags, 4)

        allTypeLines.push(command)
    }

    return allTypeLines
}

let bCommands = []
browserCommands.forEach((commandFile) => {
    const commandPath = path.resolve(`${browserDir}/${commandFile}`)
    bCommands = gatherCommands(commandPath, commandFile)
})
const allBrowserCommands = `${bCommands.join(';\n        ')};`

allTypeLines = []

let eCommands = []
elementCommands.forEach((commandFile) => {
    const commandPath = path.resolve(`${elementDir}/${commandFile}`)
    eCommands = gatherCommands(commandPath, commandFile)
})

const allElementCommands = `${eCommands.join(';\n        ')};`

const templatePath = path.resolve(__dirname + '../../templates/webdriverio.tpl.d.ts')
const templateContents = fs.readFileSync(templatePath, 'utf8')

let typingsContents = templateContents.replace('// ... element commands ...', allElementCommands)
typingsContents = typingsContents.replace('// ... browser commands ...', allBrowserCommands)

const outputFileWebdriverio = path.join(__dirname, '..', '..', 'packages/webdriverio', 'webdriverio-core.d.ts')
fs.writeFileSync(outputFileWebdriverio, typingsContents, { encoding: 'utf-8' })

const outputFileSync = path.join(__dirname, '..', '..', 'packages/wdio-sync', 'webdriverio-core.d.ts')
fs.writeFileSync(outputFileSync, typingsContents, { encoding: 'utf-8' })

// eslint-disable-next-line no-console
console.log(`Generated typings file at ${outputFileWebdriverio}`)

// eslint-disable-next-line no-console
console.log(`Generated typings file at ${outputFileSync}`)
